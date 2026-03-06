const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Database error:', err.message);
    } else {
        console.log('✅ Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT DEFAULT 'user',
        city TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Assets table
    db.run(`CREATE TABLE IF NOT EXISTS assets (
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
        address TEXT,
        createdBy INTEGER,
        createdByRole TEXT,
        FOREIGN KEY (createdBy) REFERENCES users(id)
    )`);

    console.log('✅ Database tables ready');
    
    // Create default admin if not exists
    createDefaultAdmin();
    checkSampleData();
}

// Create default admin
async function createDefaultAdmin() {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    db.get('SELECT * FROM users WHERE role = ?', ['admin'], (err, row) => {
        if (!row) {
            db.run(
                'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
                ['admin', hashedPassword, 'admin@hackzz.com', 'admin'],
                function(err) {
                    if (err) {
                        console.error('Error creating admin:', err);
                    } else {
                        console.log('✅ Default admin created (username: admin, password: admin123)');
                    }
                }
            );
        }
    });
}

// Insert sample data if needed
function checkSampleData() {
    db.get('SELECT COUNT(*) as count FROM assets', (err, row) => {
        if (row && row.count === 0) {
            const sampleAssets = [
                {
                    id: '1', name: 'Signature Bridge', type: 'road', status: 'operational',
                    description: 'Iconic cable-stayed bridge across Yamuna River',
                    lat: 28.7087, lng: 77.2297, reports: 1, city: 'Delhi',
                    lastUpdated: new Date().toISOString(), address: 'Wazirabad, Delhi'
                },
                {
                    id: '2', name: 'Delhi Metro - Rajiv Chowk', type: 'facility', status: 'operational',
                    description: 'Busiest metro station with Yellow & Blue line interchange',
                    lat: 28.6328, lng: 77.2197, reports: 0, city: 'Delhi',
                    lastUpdated: new Date().toISOString(), address: 'Connaught Place, Delhi'
                },
                {
                    id: '3', name: 'Bandra-Worli Sea Link', type: 'road', status: 'operational',
                    description: '8-lane cable-stayed bridge connecting Bandra and Worli',
                    lat: 19.0368, lng: 72.8180, reports: 0, city: 'Mumbai',
                    lastUpdated: new Date().toISOString(), address: 'Bandra West, Mumbai'
                },
                {
                    id: '4', name: 'Namma Metro - MG Road', type: 'facility', status: 'operational',
                    description: 'Purple Line metro station in central business district',
                    lat: 12.9756, lng: 77.6067, reports: 0, city: 'Bangalore',
                    lastUpdated: new Date().toISOString(), address: 'MG Road, Bengaluru'
                },
                {
                    id: '5', name: 'Chennai Metro - Central', type: 'facility', status: 'operational',
                    description: 'Interchange station for metro and suburban trains',
                    lat: 13.0827, lng: 80.2756, reports: 0, city: 'Chennai',
                    lastUpdated: new Date().toISOString(), address: 'Park Town, Chennai'
                }
            ];

            const stmt = db.prepare(`INSERT INTO assets 
                (id, name, type, status, description, lat, lng, reports, lastUpdated, city, address) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

            sampleAssets.forEach(asset => {
                stmt.run(asset.id, asset.name, asset.type, asset.status, asset.description,
                    asset.lat, asset.lng, asset.reports, asset.lastUpdated, asset.city, asset.address);
            });
            stmt.finalize();
            console.log('✅ Sample data inserted');
        }
    });
}

// JWT Verification Middleware
function verifyToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, 'your-secret-key');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
}

// Role-based authorization middleware
function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: `Access denied. Required roles: ${roles.join(', ')}` 
            });
        }
        
        next();
    };
}

// ==================== API ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        database: 'connected', 
        server: 'running',
        timestamp: new Date().toISOString() 
    });
});

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, email, city } = req.body;

        if (!username || !password || !email) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }

        db.get('SELECT * FROM users WHERE username = ? OR email = ?', 
            [username, email], async (err, existingUser) => {
                if (err) {
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Database error' 
                    });
                }
                
                if (existingUser) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Username or email already exists' 
                    });
                }

                const hashedPassword = await bcrypt.hash(password, 10);

                db.run(
                    'INSERT INTO users (username, password, email, city, role) VALUES (?, ?, ?, ?, ?)',
                    [username, hashedPassword, email, city || null, 'user'],
                    function(err) {
                        if (err) {
                            return res.status(500).json({ 
                                success: false, 
                                message: 'Error creating user' 
                            });
                        }
                        
                        res.status(201).json({ 
                            success: true, 
                            message: 'Registration successful' 
                        });
                    }
                );
            });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Login
app.post('/api/auth/login', (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username and password required' 
            });
        }

        db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
            if (err) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Database error' 
                });
            }

            if (!user) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Invalid username or password' 
                });
            }

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Invalid username or password' 
                });
            }

            const token = jwt.sign(
                { 
                    id: user.id, 
                    username: user.username, 
                    role: user.role, 
                    city: user.city 
                },
                'your-secret-key',
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        city: user.city
                    }
                }
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Get all users (admin only)
app.get('/api/admin/users', verifyToken, authorize('admin'), (req, res) => {
    db.all('SELECT id, username, email, role, city, createdAt FROM users ORDER BY createdAt DESC', (err, rows) => {
        if (err) {
            res.status(500).json({ success: false, message: 'Error fetching users' });
        } else {
            res.json({ success: true, data: rows });
        }
    });
});

// Update user role (admin only)
app.patch('/api/admin/users/:userId/role', verifyToken, authorize('admin'), (req, res) => {
    const { role } = req.body;
    const userId = req.params.userId;

    if (!['user', 'city_planner', 'admin'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    db.run('UPDATE users SET role = ? WHERE id = ?', [role, userId], function(err) {
        if (err) {
            res.status(500).json({ success: false, message: 'Error updating role' });
        } else if (this.changes === 0) {
            res.status(404).json({ success: false, message: 'User not found' });
        } else {
            res.json({ success: true, message: 'Role updated successfully' });
        }
    });
});

// Assign city to user (admin only)
app.patch('/api/admin/users/:userId/city', verifyToken, authorize('admin'), (req, res) => {
    const { city } = req.body;
    const userId = req.params.userId;

    db.run('UPDATE users SET city = ? WHERE id = ?', [city, userId], function(err) {
        if (err) {
            res.status(500).json({ success: false, message: 'Error assigning city' });
        } else if (this.changes === 0) {
            res.status(404).json({ success: false, message: 'User not found' });
        } else {
            res.json({ success: true, message: `City ${city} assigned successfully` });
        }
    });
});

// Delete user (admin only)
app.delete('/api/admin/users/:userId', verifyToken, authorize('admin'), (req, res) => {
    const userId = req.params.userId;

    if (parseInt(userId) === req.user.id) {
        return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    }

    db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
        if (err) {
            res.status(500).json({ success: false, message: 'Error deleting user' });
        } else if (this.changes === 0) {
            res.status(404).json({ success: false, message: 'User not found' });
        } else {
            res.json({ success: true, message: 'User deleted successfully' });
        }
    });
});

// Get all assets
app.get('/api/assets', (req, res) => {
    db.all('SELECT * FROM assets ORDER BY lastUpdated DESC', (err, rows) => {
        if (err) {
            res.status(500).json({ success: false, message: 'Error fetching assets' });
        } else {
            res.json({ success: true, data: rows });
        }
    });
});

// Get single asset
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

// Create asset (authenticated users)
app.post('/api/assets', verifyToken, (req, res) => {
    const { name, type, status, city, ward, lat, lng, description } = req.body;

    if (!name || !type || !status || !city || !lat || !lng) {
        return res.status(400).json({ 
            success: false, 
            message: 'Missing required fields' 
        });
    }

    // City planners can only create in their city
    if (req.user.role === 'city_planner' && req.user.city !== city) {
        return res.status(403).json({ 
            success: false, 
            message: `You can only create assets in ${req.user.city}` 
        });
    }

    const id = Date.now().toString();
    const lastUpdated = new Date().toISOString();
    const address = ward ? `${ward}, ${city}, India` : `${city}, India`;

    db.run(
        `INSERT INTO assets (id, name, type, status, description, lat, lng, reports, lastUpdated, city, ward, address, createdBy, createdByRole)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name, type, status, description || '', lat, lng, 0, lastUpdated, city, ward || '', address, req.user.id, req.user.role],
        function(err) {
            if (err) {
                console.error('Error creating asset:', err);
                res.status(500).json({ success: false, message: 'Error creating asset' });
            } else {
                res.status(201).json({ 
                    success: true, 
                    message: 'Asset created successfully',
                    data: { id, name, type, status, city, lat, lng, lastUpdated }
                });
            }
        }
    );
});

// Update asset (admin, city planner, or creator)
app.put('/api/assets/:id', verifyToken, (req, res) => {
    const assetId = req.params.id;
    const updates = req.body;

    // First get the asset to check permissions
    db.get('SELECT * FROM assets WHERE id = ?', [assetId], (err, asset) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error fetching asset' });
        }
        if (!asset) {
            return res.status(404).json({ success: false, message: 'Asset not found' });
        }

        // Check permissions
        if (req.user.role === 'admin') {
            // Admin can update anything
        } else if (req.user.role === 'city_planner' && req.user.city === asset.city) {
            // City planner can update in their city
        } else if (req.user.role === 'user' && asset.createdBy === req.user.id) {
            // User can update their own assets
        } else {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to update this asset' 
            });
        }

        // Build update query
        const fields = [];
        const values = [];
        
        Object.keys(updates).forEach(key => {
            if (key !== 'id' && key !== 'createdBy' && key !== 'createdByRole') {
                fields.push(`${key} = ?`);
                values.push(updates[key]);
            }
        });
        
        values.push(new Date().toISOString());
        values.push(assetId);

        db.run(
            `UPDATE assets SET ${fields.join(', ')}, lastUpdated = ? WHERE id = ?`,
            values,
            function(err) {
                if (err) {
                    res.status(500).json({ success: false, message: 'Error updating asset' });
                } else {
                    res.json({ success: true, message: 'Asset updated successfully' });
                }
            }
        );
    });
});

// Delete asset (admin and city planner only)
app.delete('/api/assets/:id', verifyToken, (req, res) => {
    const assetId = req.params.id;

    db.get('SELECT * FROM assets WHERE id = ?', [assetId], (err, asset) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error fetching asset' });
        }
        if (!asset) {
            return res.status(404).json({ success: false, message: 'Asset not found' });
        }

        // Check permissions
        if (req.user.role === 'admin') {
            // Admin can delete anything
        } else if (req.user.role === 'city_planner' && req.user.city === asset.city) {
            // City planner can delete in their city
        } else {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to delete this asset' 
            });
        }

        db.run('DELETE FROM assets WHERE id = ?', [assetId], function(err) {
            if (err) {
                res.status(500).json({ success: false, message: 'Error deleting asset' });
            } else {
                res.json({ success: true, message: 'Asset deleted successfully' });
            }
        });
    });
});

// Add report (anyone can report)
app.patch('/api/assets/:id/report', (req, res) => {
    const assetId = req.params.id;

    db.get('SELECT reports, status FROM assets WHERE id = ?', [assetId], (err, asset) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error fetching asset' });
        }
        if (!asset) {
            return res.status(404).json({ success: false, message: 'Asset not found' });
        }

        const newReports = asset.reports + 1;
        let newStatus = asset.status;

        if (newReports >= 5 && asset.status !== 'critical') {
            newStatus = 'critical';
        } else if (newReports >= 3 && asset.status !== 'maintenance') {
            newStatus = 'maintenance';
        }

        db.run(
            'UPDATE assets SET reports = ?, status = ?, lastUpdated = ? WHERE id = ?',
            [newReports, newStatus, new Date().toISOString(), assetId],
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
            }
        );
    });
});

// Get statistics
app.get('/api/stats', (req, res) => {
    db.get(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN type = 'road' THEN 1 ELSE 0 END) as roads,
            SUM(CASE WHEN type = 'utility' THEN 1 ELSE 0 END) as utilities,
            SUM(CASE WHEN type = 'facility' THEN 1 ELSE 0 END) as facilities,
            SUM(CASE WHEN type = 'railway' THEN 1 ELSE 0 END) as railways,
            SUM(CASE WHEN type = 'airport' THEN 1 ELSE 0 END) as airports,
            SUM(CASE WHEN type = 'smart_pole' THEN 1 ELSE 0 END) as smartPoles,
            SUM(CASE WHEN status = 'critical' THEN 1 ELSE 0 END) as critical,
            SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance,
            SUM(CASE WHEN status = 'operational' THEN 1 ELSE 0 END) as operational
        FROM assets
    `, (err, row) => {
        if (err) {
            res.status(500).json({ success: false, message: 'Error fetching stats' });
        } else {
            res.json({ success: true, data: row || {} });
        }
    });
});

// Get cities list
app.get('/api/cities', (req, res) => {
    db.all('SELECT DISTINCT city FROM assets ORDER BY city', (err, rows) => {
        if (err) {
            res.status(500).json({ success: false, message: 'Error fetching cities' });
        } else {
            res.json({ success: true, data: rows.map(r => r.city) });
        }
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n🚀 ==================================');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🚀 API available at http://localhost:${PORT}/api`);
    console.log(`🚀 Health check: http://localhost:${PORT}/api/health`);
    console.log('🚀 ==================================\n');
    console.log('📝 Default Admin: username: admin, password: admin123');
});