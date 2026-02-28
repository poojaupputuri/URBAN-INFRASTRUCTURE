const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== SQLITE DATABASE SETUP ====================
const dbPath = path.join(__dirname, 'urban_infrastructure.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
    } else {
        console.log('✅ Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    console.log('📦 Creating database tables...');
    
    // Create assets table
    db.run(`
        CREATE TABLE IF NOT EXISTS assets (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            status TEXT NOT NULL,
            description TEXT,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            reports INTEGER DEFAULT 0,
            lastUpdated TEXT NOT NULL,
            city TEXT NOT NULL,
            ward TEXT,
            address TEXT
        )
    `, function(err) {
        if (err) {
            console.error('❌ Error creating table:', err.message);
            startServer(); // Still start server even if table creation fails
            return;
        }
        console.log('✅ Assets table ready');
        
        // Check if data exists
        checkAndInsertSampleData();
    });
}

// Check if data exists, if not insert sample data
function checkAndInsertSampleData() {
    db.get(`SELECT COUNT(*) as count FROM assets`, (err, row) => {
        if (err) {
            console.log('⚠️ Could not check data count, but server will still start');
            startServer();
            return;
        }

        if (row.count === 0) {
            console.log('📊 Inserting sample data...');
            insertSampleData();
        } else {
            console.log(`📊 Database already contains ${row.count} assets`);
            startServer();
        }
    });
}

// Insert sample data
function insertSampleData() {
    const sampleAssets = [
        // Delhi-NCR
        {
            id: '1',
            name: 'Signature Bridge',
            type: 'road',
            status: 'operational',
            description: 'Iconic cable-stayed bridge across Yamuna River',
            lat: 28.7087,
            lng: 77.2297,
            reports: 1,
            lastUpdated: new Date().toISOString(),
            city: 'Delhi',
            ward: 'Wazirabad',
            address: 'Wazirabad, Delhi, 110040'
        },
        {
            id: '2',
            name: 'Delhi Metro - Rajiv Chowk',
            type: 'facility',
            status: 'operational',
            description: 'Busiest metro station with Yellow & Blue line interchange',
            lat: 28.6328,
            lng: 77.2197,
            reports: 0,
            lastUpdated: new Date().toISOString(),
            city: 'Delhi',
            ward: 'Connaught Place',
            address: 'Connaught Place, Delhi, 110001'
        },
        {
            id: '3',
            name: 'Okhla Water Treatment Plant',
            type: 'utility',
            status: 'maintenance',
            description: 'Major water treatment facility - pump maintenance ongoing',
            lat: 28.5567,
            lng: 77.2777,
            reports: 3,
            lastUpdated: new Date().toISOString(),
            city: 'Delhi',
            ward: 'Okhla',
            address: 'Okhla Industrial Area, Delhi, 110020'
        },
        // Mumbai
        {
            id: '4',
            name: 'Bandra-Worli Sea Link',
            type: 'road',
            status: 'operational',
            description: '8-lane cable-stayed bridge connecting Bandra and Worli',
            lat: 19.0368,
            lng: 72.8180,
            reports: 0,
            lastUpdated: new Date().toISOString(),
            city: 'Mumbai',
            ward: 'Bandra',
            address: 'Bandra West, Mumbai, 400050'
        },
        {
            id: '5',
            name: 'Chhatrapati Shivaji Terminus',
            type: 'facility',
            status: 'operational',
            description: 'Historic railway station, UNESCO World Heritage Site',
            lat: 18.9398,
            lng: 72.8355,
            reports: 0,
            lastUpdated: new Date().toISOString(),
            city: 'Mumbai',
            ward: 'Fort',
            address: 'Fort, Mumbai, 400001'
        },
        {
            id: '6',
            name: 'Dharavi Power Substation',
            type: 'utility',
            status: 'critical',
            description: 'Transformer failure, frequent power outages reported',
            lat: 19.0446,
            lng: 72.8557,
            reports: 8,
            lastUpdated: new Date().toISOString(),
            city: 'Mumbai',
            ward: 'Dharavi',
            address: 'Dharavi, Mumbai, 400017'
        },
        // Bengaluru
        {
            id: '7',
            name: 'Namma Metro - MG Road',
            type: 'facility',
            status: 'operational',
            description: 'Purple Line metro station in central business district',
            lat: 12.9756,
            lng: 77.6067,
            reports: 0,
            lastUpdated: new Date().toISOString(),
            city: 'Bangalore',
            ward: 'MG Road',
            address: 'MG Road, Bengaluru, 560001'
        },
        {
            id: '8',
            name: 'Electronic City Flyover',
            type: 'road',
            status: 'maintenance',
            description: 'Repair work due to heavy vehicle traffic',
            lat: 12.8456,
            lng: 77.6678,
            reports: 4,
            lastUpdated: new Date().toISOString(),
            city: 'Bangalore',
            ward: 'Electronic City',
            address: 'Electronic City, Bengaluru, 560100'
        },
        // Chennai
        {
            id: '9',
            name: 'Chennai Metro - Central',
            type: 'facility',
            status: 'operational',
            description: 'Interchange station for metro and suburban trains',
            lat: 13.0827,
            lng: 80.2756,
            reports: 0,
            lastUpdated: new Date().toISOString(),
            city: 'Chennai',
            ward: 'Park Town',
            address: 'Park Town, Chennai, 600003'
        },
        // Kolkata
        {
            id: '10',
            name: 'Howrah Bridge',
            type: 'road',
            status: 'operational',
            description: 'Iconic cantilever bridge over Hooghly River',
            lat: 22.5851,
            lng: 88.3467,
            reports: 1,
            lastUpdated: new Date().toISOString(),
            city: 'Kolkata',
            ward: 'Howrah',
            address: 'Howrah, Kolkata, 711101'
        },
        // Hyderabad
        {
            id: '11',
            name: 'Hyderabad Metro - Ameerpet',
            type: 'facility',
            status: 'operational',
            description: 'Largest metro interchange in India',
            lat: 17.4375,
            lng: 78.4483,
            reports: 0,
            lastUpdated: new Date().toISOString(),
            city: 'Hyderabad',
            ward: 'Ameerpet',
            address: 'Ameerpet, Hyderabad, 500016'
        },
        // Pune
        {
            id: '12',
            name: 'Katraj Tunnel',
            type: 'road',
            status: 'operational',
            description: 'Mumbai-Bangalore highway tunnel',
            lat: 18.4567,
            lng: 73.8567,
            reports: 1,
            lastUpdated: new Date().toISOString(),
            city: 'Pune',
            ward: 'Katraj',
            address: 'Katraj, Pune, 411046'
        },
        // Ahmedabad
        {
            id: '13',
            name: 'Sabarmati Riverfront',
            type: 'facility',
            status: 'operational',
            description: 'Urban renewal project along Sabarmati River',
            lat: 23.0225,
            lng: 72.5714,
            reports: 0,
            lastUpdated: new Date().toISOString(),
            city: 'Ahmedabad',
            ward: 'Ellisbridge',
            address: 'Ellisbridge, Ahmedabad, 380006'
        }
    ];

    let inserted = 0;
    
    sampleAssets.forEach(asset => {
        db.run(`
            INSERT OR IGNORE INTO assets (id, name, type, status, description, lat, lng, reports, lastUpdated, city, ward, address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            asset.id,
            asset.name,
            asset.type,
            asset.status,
            asset.description,
            asset.lat,
            asset.lng,
            asset.reports,
            asset.lastUpdated,
            asset.city,
            asset.ward,
            asset.address
        ],
        function(err) {
            if (err) {
                console.error(`Error inserting ${asset.name}:`, err.message);
            } else {
                inserted++;
                if (inserted === sampleAssets.length) {
                    console.log(`✅ ${inserted} sample assets inserted successfully`);
                    startServer();
                }
            }
        });
    });
}

// Start the server after database is ready
function startServer() {
    // ==================== API ROUTES ====================

    // Root endpoint
    app.get('/', (req, res) => {
        res.json({ 
            message: '🏗️ Urban Infrastructure API',
            status: 'running',
            endpoints: {
                health: '/api/health',
                assets: '/api/assets',
                stats: '/api/stats',
                cities: '/api/cities'
            }
        });
    });

    // Health check endpoint
    app.get('/api/health', (req, res) => {
        db.get('SELECT 1 as health', (err) => {
            if (err) {
                res.json({ 
                    status: 'DEGRADED', 
                    database: 'disconnected',
                    server: 'running',
                    timestamp: new Date().toISOString()
                });
            } else {
                res.json({ 
                    status: 'OK', 
                    database: 'connected',
                    server: 'running',
                    timestamp: new Date().toISOString()
                });
            }
        });
    });

    // GET all assets
    app.get('/api/assets', (req, res) => {
        const { type, status, city } = req.query;
        
        let sql = 'SELECT * FROM assets WHERE 1=1';
        const params = [];

        if (type) {
            sql += ' AND type = ?';
            params.push(type);
        }
        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }
        if (city) {
            sql += ' AND city LIKE ?';
            params.push(`%${city}%`);
        }

        sql += ' ORDER BY lastUpdated DESC';

        db.all(sql, params, (err, rows) => {
            if (err) {
                console.error('Error fetching assets:', err.message);
                res.status(500).json({ success: false, message: 'Error fetching assets' });
            } else {
                res.json({
                    success: true,
                    count: rows.length,
                    data: rows
                });
            }
        });
    });

    // GET single asset
    app.get('/api/assets/:id', (req, res) => {
        db.get('SELECT * FROM assets WHERE id = ?', [req.params.id], (err, row) => {
            if (err) {
                res.status(500).json({ success: false, message: 'Error fetching asset' });
            } else if (!row) {
                res.status(404).json({ success: false, message: 'Asset not found' });
            } else {
                res.json({ success: true, data: row });
            }
        });
    });

    // POST create asset
    app.post('/api/assets', (req, res) => {
        const { name, type, status, city, ward, lat, lng, description } = req.body;

        if (!name || !type || !status || !city || !lat || !lng) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields' 
            });
        }

        const id = Date.now().toString();
        const lastUpdated = new Date().toISOString();
        const address = ward ? `${ward}, ${city}, India` : `${city}, India`;

        db.run(`
            INSERT INTO assets (id, name, type, status, description, lat, lng, reports, lastUpdated, city, ward, address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [id, name, type, status, description || '', lat, lng, 0, lastUpdated, city, ward || '', address],
        function(err) {
            if (err) {
                res.status(500).json({ success: false, message: 'Error creating asset' });
            } else {
                res.status(201).json({ 
                    success: true, 
                    message: 'Asset created successfully',
                    data: { id, name, type, status, city, lat, lng, reports: 0, lastUpdated }
                });
            }
        });
    });

    // PUT update asset
    app.put('/api/assets/:id', (req, res) => {
        const { name, type, status, city, ward, lat, lng, description } = req.body;
        const lastUpdated = new Date().toISOString();
        const address = ward ? `${ward}, ${city}, India` : `${city}, India`;

        db.run(`
            UPDATE assets 
            SET name = ?, type = ?, status = ?, city = ?, ward = ?, 
                lat = ?, lng = ?, description = ?, address = ?, lastUpdated = ?
            WHERE id = ?
        `, [name, type, status, city, ward || '', lat, lng, description || '', address, lastUpdated, req.params.id],
        function(err) {
            if (err) {
                res.status(500).json({ success: false, message: 'Error updating asset' });
            } else if (this.changes === 0) {
                res.status(404).json({ success: false, message: 'Asset not found' });
            } else {
                res.json({ success: true, message: 'Asset updated successfully' });
            }
        });
    });

    // DELETE asset
    app.delete('/api/assets/:id', (req, res) => {
        db.run('DELETE FROM assets WHERE id = ?', [req.params.id], function(err) {
            if (err) {
                res.status(500).json({ success: false, message: 'Error deleting asset' });
            } else if (this.changes === 0) {
                res.status(404).json({ success: false, message: 'Asset not found' });
            } else {
                res.json({ success: true, message: 'Asset deleted successfully' });
            }
        });
    });

    // PATCH add report
    app.patch('/api/assets/:id/report', (req, res) => {
        db.get('SELECT reports, status FROM assets WHERE id = ?', [req.params.id], (err, row) => {
            if (err) {
                res.status(500).json({ success: false, message: 'Error adding report' });
            } else if (!row) {
                res.status(404).json({ success: false, message: 'Asset not found' });
            } else {
                const newReports = row.reports + 1;
                let newStatus = row.status;

                if (newReports >= 5 && row.status !== 'critical') {
                    newStatus = 'critical';
                } else if (newReports >= 3 && row.status !== 'maintenance') {
                    newStatus = 'maintenance';
                }

                const lastUpdated = new Date().toISOString();

                db.run(`
                    UPDATE assets 
                    SET reports = ?, status = ?, lastUpdated = ?
                    WHERE id = ?
                `, [newReports, newStatus, lastUpdated, req.params.id],
                function(err) {
                    if (err) {
                        res.status(500).json({ success: false, message: 'Error adding report' });
                    } else {
                        res.json({ 
                            success: true, 
                            message: 'Report added successfully',
                            data: { reports: newReports, status: newStatus }
                        });
                    }
                });
            }
        });
    });

    // GET statistics
    app.get('/api/stats', (req, res) => {
        db.get(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN type = 'road' THEN 1 ELSE 0 END) as roads,
                SUM(CASE WHEN type = 'utility' THEN 1 ELSE 0 END) as utilities,
                SUM(CASE WHEN type = 'facility' THEN 1 ELSE 0 END) as facilities,
                SUM(CASE WHEN status = 'critical' THEN 1 ELSE 0 END) as critical,
                SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance
            FROM assets
        `, (err, row) => {
            if (err) {
                res.status(500).json({ success: false, message: 'Error fetching stats' });
            } else {
                res.json({ 
                    success: true, 
                    data: row || {
                        total: 0, roads: 0, utilities: 0, facilities: 0,
                        critical: 0, maintenance: 0
                    }
                });
            }
        });
    });

    // GET cities list
    app.get('/api/cities', (req, res) => {
        db.all('SELECT DISTINCT city FROM assets ORDER BY city', (err, rows) => {
            if (err) {
                res.status(500).json({ success: false, message: 'Error fetching cities' });
            } else {
                const cities = rows.map(row => row.city);
                res.json({ success: true, data: cities });
            }
        });
    });

    // Start listening
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log('\n🚀 ==================================');
        console.log(`🚀 Server is RUNNING on:`);
        console.log(`🚀 http://localhost:${PORT}`);
        console.log(`🚀 http://127.0.0.1:${PORT}`);
        console.log('🚀 ==================================\n');
        console.log('📡 Test these endpoints:');
        console.log(`📍 http://localhost:${PORT}/api/health`);
        console.log(`📍 http://localhost:${PORT}/api/assets`);
        console.log(`📍 http://localhost:${PORT}/api/stats`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`❌ Port ${PORT} is already in use. Try these solutions:`);
            console.error('1. Close other applications');
            console.error('2. Run: netstat -ano | findstr :5000');
            console.error('3. Kill the process: taskkill /PID <PID> /F');
        } else {
            console.error('❌ Server error:', err.message);
        }
    });
}

// Handle process termination
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('📁 Database closed');
        }
        process.exit(0);
    });
});