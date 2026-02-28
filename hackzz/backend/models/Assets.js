const mongoose = require('mongoose');

// Define the Asset schema
const assetSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Asset name is required'],
        trim: true,
        maxlength: [100, 'Asset name cannot exceed 100 characters']
    },
    type: {
        type: String,
        required: [true, 'Asset type is required'],
        enum: {
            values: ['road', 'utility', 'facility'],
            message: 'Type must be either road, utility, or facility'
        }
    },
    status: {
        type: String,
        required: [true, 'Asset status is required'],
        enum: {
            values: ['operational', 'maintenance', 'planned', 'critical'],
            message: 'Status must be operational, maintenance, planned, or critical'
        },
        default: 'operational'
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: [true, 'Coordinates are required'],
            validate: {
                validator: function(v) {
                    return v.length === 2 && 
                           v[0] >= -180 && v[0] <= 180 && 
                           v[1] >= -90 && v[1] <= 90;
                },
                message: 'Invalid coordinates'
            }
        }
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true
    },
    ward: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    reports: {
        type: Number,
        default: 0,
        min: [0, 'Reports cannot be negative']
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: String,
        default: 'system'
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true // Automatically add createdAt and updatedAt
});

// Create geospatial index for location queries
assetSchema.index({ location: '2dsphere' });

// Create text index for search
assetSchema.index({ 
    name: 'text', 
    description: 'text', 
    city: 'text', 
    ward: 'text' 
});

// Virtual for formatted coordinates
assetSchema.virtual('coordinates').get(function() {
    return {
        lat: this.location.coordinates[1],
        lng: this.location.coordinates[0]
    };
});

// Method to update lastUpdated timestamp
assetSchema.methods.updateTimestamp = function() {
    this.lastUpdated = new Date();
    return this.save();
};

// Static method to find assets by city
assetSchema.statics.findByCity = function(city) {
    return this.find({ city: new RegExp(city, 'i') });
};

// Static method to find assets near location
assetSchema.statics.findNear = function(lat, lng, maxDistance = 5000) {
    return this.find({
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [lng, lat]
                },
                $maxDistance: maxDistance
            }
        }
    });
};

// Static method to get statistics
assetSchema.statics.getStats = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                roads: { $sum: { $cond: [{ $eq: ['$type', 'road'] }, 1, 0] } },
                utilities: { $sum: { $cond: [{ $eq: ['$type', 'utility'] }, 1, 0] } },
                facilities: { $sum: { $cond: [{ $eq: ['$type', 'facility'] }, 1, 0] } },
                critical: { $sum: { $cond: [{ $eq: ['$status', 'critical'] }, 1, 0] } },
                maintenance: { $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] } },
                operational: { $sum: { $cond: [{ $eq: ['$status', 'operational'] }, 1, 0] } },
                planned: { $sum: { $cond: [{ $eq: ['$status', 'planned'] }, 1, 0] } }
            }
        }
    ]);
    
    return stats[0] || {
        total: 0,
        roads: 0,
        utilities: 0,
        facilities: 0,
        critical: 0,
        maintenance: 0,
        operational: 0,
        planned: 0
    };
};

// Static method to get city-wise statistics
assetSchema.statics.getCityStats = async function() {
    return this.aggregate([
        {
            $group: {
                _id: '$city',
                count: { $sum: 1 },
                critical: { $sum: { $cond: [{ $eq: ['$status', 'critical'] }, 1, 0] } },
                maintenance: { $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] } }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);
};

const Asset = mongoose.model('Asset', assetSchema);

module.exports = Asset;