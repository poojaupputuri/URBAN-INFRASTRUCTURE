// ==================== STATE MANAGEMENT ====================
let assets = [];
let map;
let markers = [];
let markerCluster = null;
let currentFilter = 'all';
let selectedAssetId = null;
let selectedLocation = null;
let selectedLocationMarker = null;
let userLocation = null;
let deleteCandidateId = null;
let currentLayer = 'streets';
let currentCity = 'india';

// API Base URL - Update this with your backend URL
const API_BASE_URL = 'http://localhost:5000/api';

// Indian cities with precise coordinates
const indianCities = {
    delhi: { lat: 28.6139, lng: 77.2090, zoom: 15, name: 'Delhi-NCR' },
    mumbai: { lat: 19.0760, lng: 72.8777, zoom: 15, name: 'Mumbai' },
    bangalore: { lat: 12.9716, lng: 77.5946, zoom: 15, name: 'Bengaluru' },
    chennai: { lat: 13.0827, lng: 80.2707, zoom: 15, name: 'Chennai' },
    kolkata: { lat: 22.5726, lng: 88.3639, zoom: 15, name: 'Kolkata' },
    hyderabad: { lat: 17.3850, lng: 78.4867, zoom: 15, name: 'Hyderabad' },
    pune: { lat: 18.5204, lng: 73.8567, zoom: 15, name: 'Pune' },
    ahmedabad: { lat: 23.0225, lng: 72.5714, zoom: 15, name: 'Ahmedabad' }
};

// Sample infrastructure data (fallback if backend is unavailable)
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

// ==================== API FUNCTIONS ====================

async function fetchAssetsFromBackend() {
    try {
        console.log('Fetching assets from backend...');
        
        let url = `${API_BASE_URL}/assets`;
        if (currentFilter !== 'all') {
            if (currentFilter === 'maintenance') {
                url += '?status=maintenance,critical';
            } else {
                url += `?type=${currentFilter}`;
            }
        }
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success && result.data) {
            // Convert backend format to frontend format
            assets = result.data.map(asset => ({
                id: asset._id,
                name: asset.name,
                type: asset.type,
                status: asset.status,
                description: asset.description,
                lat: asset.location.coordinates[1],
                lng: asset.location.coordinates[0],
                reports: asset.reports || 0,
                lastUpdated: asset.lastUpdated,
                city: asset.city,
                ward: asset.ward || '',
                address: asset.address || ''
            }));
            
            console.log(`Loaded ${assets.length} assets from backend`);
            return true;
        } else {
            console.warn('Backend returned no data, using sample data');
            return false;
        }
    } catch (error) {
        console.error('Error fetching from backend:', error);
        return false;
    }
}

async function saveAssetToBackend(assetData, isUpdate = false, assetId = null) {
    try {
        const url = isUpdate ? `${API_BASE_URL}/assets/${assetId}` : `${API_BASE_URL}/assets`;
        const method = isUpdate ? 'PUT' : 'POST';
        
        // Convert frontend format to backend format
        const backendData = {
            name: assetData.name,
            type: assetData.type,
            status: assetData.status,
            city: assetData.city,
            ward: assetData.ward,
            lat: assetData.lat,
            lng: assetData.lng,
            description: assetData.description || ''
        };
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(backendData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            return { success: true, data: result.data };
        } else {
            return { success: false, error: result.message };
        }
    } catch (error) {
        console.error('Error saving to backend:', error);
        return { success: false, error: error.message };
    }
}

async function deleteAssetFromBackend(assetId) {
    try {
        const response = await fetch(`${API_BASE_URL}/assets/${assetId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Error deleting from backend:', error);
        return false;
    }
}

async function addReportToBackend(assetId) {
    try {
        const response = await fetch(`${API_BASE_URL}/assets/${assetId}/report`, {
            method: 'PATCH'
        });
        
        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Error adding report to backend:', error);
        return false;
    }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing application');
    initializeData();
    initMap();
    setupEventListeners();
    updateTimestamp();
    setInterval(updateTimestamp, 60000);
    
    // Hide selected location panel initially
    var panel = document.getElementById('selectedLocationPanel');
    if (panel) panel.style.display = 'none';
});

async function initializeData() {
    // Try to load from backend first
    const backendSuccess = await fetchAssetsFromBackend();
    
    if (!backendSuccess) {
        // Fallback to localStorage or sample data
        var savedAssets = localStorage.getItem('indianInfrastructure');
        if (savedAssets) {
            assets = JSON.parse(savedAssets);
            console.log('Loaded assets from localStorage:', assets.length);
        } else {
            assets = sampleAssets.slice(); // Create a copy
            saveToLocalStorage();
            console.log('Loaded sample assets:', assets.length);
        }
    }
    
    // Render after data is loaded
    renderStats();
    renderAssetList();
    renderMarkers();
}

function saveToLocalStorage() {
    localStorage.setItem('indianInfrastructure', JSON.stringify(assets));
    console.log('Saved to localStorage');
}

function updateTimestamp() {
    var now = new Date();
    var timeString = now.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    var lastUpdate = document.getElementById('lastUpdate');
    if (lastUpdate) lastUpdate.textContent = timeString;
}

// ==================== MAP INITIALIZATION ====================
function initMap() {
    console.log('Initializing map...');
    
    // Initialize map centered on India
    map = L.map('map', {
        center: [22.5726, 78.9629],
        zoom: 5,
        minZoom: 4,
        maxZoom: 19,
        zoomControl: false
    });

    // Add street map layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // Add scale bar
    L.control.scale({ 
        imperial: false, 
        metric: true,
        position: 'bottomright'
    }).addTo(map);

    // Initialize marker cluster for better performance
    markerCluster = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        disableClusteringAtZoom: 16
    });
    map.addLayer(markerCluster);

    // Handle map click for location selection
    map.on('click', function(e) {
        console.log('Map clicked at:', e.latlng);
        var lat = e.latlng.lat;
        var lng = e.latlng.lng;
        setSelectedLocation(lat, lng);
    });

    // Update zoom display
    map.on('zoomend', function() {
        var zoom = map.getZoom();
        document.getElementById('currentZoom').textContent = zoom;
        document.getElementById('zoomLevel').innerHTML = 'Zoom: ' + zoom + 'x';
        updateVisibleStats();
    });

    // Update visible stats on move
    map.on('moveend', updateVisibleStats);

    // Add location handlers
    map.on('locationfound', handleLocationFound);
    map.on('locationerror', handleLocationError);

    console.log('Map initialized successfully');
}

// ==================== LOCATION FUNCTIONS ====================
function setSelectedLocation(lat, lng) {
    console.log('Setting selected location:', lat, lng);
    
    selectedLocation = { lat: lat, lng: lng };
    
    // Update UI
    document.getElementById('selectedLat').textContent = lat.toFixed(6);
    document.getElementById('selectedLng').textContent = lng.toFixed(6);
    document.getElementById('selectedLocationPanel').style.display = 'block';
    
    // Update form fields
    document.getElementById('latitude').value = lat.toFixed(6);
    document.getElementById('longitude').value = lng.toFixed(6);
    
    // Remove existing selected location marker
    if (selectedLocationMarker) {
        map.removeLayer(selectedLocationMarker);
    }
    
    // Add new selected location marker
    var selectedIcon = L.divIcon({
        className: 'custom-marker selected-marker',
        html: '<i class="fas fa-map-pin" style="color: white;"></i>',
        iconSize: [36, 36],
        popupAnchor: [0, -18]
    });
    
    selectedLocationMarker = L.marker([lat, lng], { 
        icon: selectedIcon,
        zIndexOffset: 1000
    }).addTo(map);
    
    // Add popup with location info
    selectedLocationMarker.bindPopup(
        '<div style="text-align: center; padding: 10px;">' +
        '<b>📍 Selected Location</b><br>' +
        'Lat: ' + lat.toFixed(6) + '<br>' +
        'Lng: ' + lng.toFixed(6) + '<br>' +
        '<button onclick="useSelectedLocationForAsset()" ' +
        'style="margin-top:10px; padding:8px 15px; background:#27ae60; color:white; ' +
        'border:none; border-radius:4px; cursor:pointer; width:100%;">' +
        '<i class="fas fa-plus-circle"></i> Add Asset Here</button>' +
        '</div>'
    ).openPopup();
    
    showToast('📍 Location selected', 'success');
}

function clearSelectedLocation() {
    selectedLocation = null;
    document.getElementById('selectedLocationPanel').style.display = 'none';
    document.getElementById('selectedLat').textContent = '--';
    document.getElementById('selectedLng').textContent = '--';
    document.getElementById('latitude').value = '';
    document.getElementById('longitude').value = '';
    
    if (selectedLocationMarker) {
        map.removeLayer(selectedLocationMarker);
        selectedLocationMarker = null;
    }
}

// ==================== USER LOCATION ====================
function getUserLocation() {
    var locateBtn = document.getElementById('locateUserBtn');
    var originalHtml = locateBtn.innerHTML;
    locateBtn.innerHTML = '<div class="location-loading"></div>';
    locateBtn.disabled = true;
    
    map.locate({
        setView: true,
        maxZoom: 16,
        enableHighAccuracy: true,
        timeout: 10000
    });
    
    setTimeout(function() {
        if (locateBtn.disabled) {
            locateBtn.innerHTML = originalHtml;
            locateBtn.disabled = false;
            showToast('Location request timed out', 'error');
        }
    }, 10000);
}

function handleLocationFound(e) {
    var lat = e.latlng.lat;
    var lng = e.latlng.lng;
    var accuracy = e.accuracy;
    
    map.flyTo([lat, lng], 16, {
        animate: true,
        duration: 2
    });
    
    setTimeout(function() {
        setSelectedLocation(lat, lng);
    }, 500);
    
    var circle = L.circle([lat, lng], {
        radius: accuracy,
        color: '#3498db',
        fillColor: '#3498db',
        fillOpacity: 0.1,
        weight: 2
    }).addTo(map);
    
    setTimeout(function() {
        map.removeLayer(circle);
    }, 5000);
    
    showToast('📍 Location found! Accuracy: ' + Math.round(accuracy) + 'm', 'success');
    
    var locateBtn = document.getElementById('locateUserBtn');
    locateBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i>';
    locateBtn.disabled = false;
}

function handleLocationError(e) {
    showToast('Unable to get your location. Please check permissions.', 'error');
    
    var locateBtn = document.getElementById('locateUserBtn');
    locateBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i>';
    locateBtn.disabled = false;
}

// ==================== CITY NAVIGATION ====================
function flyToCity(cityKey) {
    var city = indianCities[cityKey];
    if (city) {
        map.flyTo([city.lat, city.lng], city.zoom, {
            animate: true,
            duration: 2
        });
        
        document.getElementById('currentCityDisplay').textContent = city.name;
        showToast('📍 Flying to ' + city.name, 'success');
        currentCity = cityKey;
    }
}

function resetToIndiaView() {
    map.flyTo([22.5726, 78.9629], 5, {
        animate: true,
        duration: 2
    });
    document.getElementById('currentCityDisplay').textContent = 'India';
    showToast('🗺️ Showing all India', 'success');
}

// ==================== MARKER FUNCTIONS ====================
function renderMarkers() {
    console.log('Rendering markers, total assets:', assets.length);
    
    // Clear existing markers from cluster
    markerCluster.clearLayers();
    
    // Filter assets
    var filteredAssets = [];
    if (currentFilter === 'all') {
        filteredAssets = assets;
    } else if (currentFilter === 'maintenance') {
        filteredAssets = assets.filter(function(a) {
            return a.status === 'maintenance' || a.status === 'critical';
        });
    } else {
        filteredAssets = assets.filter(function(a) {
            return a.type === currentFilter;
        });
    }
    
    console.log('Filtered assets:', filteredAssets.length);
    
    // Create markers
    for (var i = 0; i < filteredAssets.length; i++) {
        var asset = filteredAssets[i];
        
        // Create marker icon based on type and status
        var markerColor = getMarkerColor(asset);
        var iconHtml = getMarkerIcon(asset);
        
        var icon = L.divIcon({
            className: 'custom-marker ' + markerColor,
            html: iconHtml,
            iconSize: [36, 36],
            popupAnchor: [0, -18]
        });
        
        // Create marker
        var marker = L.marker([asset.lat, asset.lng], { 
            icon: icon,
            title: asset.name
        });
        
        // Bind popup
        marker.bindPopup(createPopupContent(asset));
        
        // Bind tooltip
        marker.bindTooltip(asset.name, {
            permanent: false,
            direction: 'top'
        });
        
        // Add click handler
        marker.on('click', function(assetId) {
            return function() {
                selectedAssetId = assetId;
                highlightAssetInList(assetId);
            };
        }(asset.id));
        
        // Add to cluster
        markerCluster.addLayer(marker);
    }
    
    updateVisibleStats();
    console.log('Markers rendered successfully');
}

function getMarkerIcon(asset) {
    var icon = '';
    switch(asset.type) {
        case 'road': icon = 'fa-road'; break;
        case 'utility': icon = 'fa-bolt'; break;
        case 'facility': icon = 'fa-building'; break;
        default: icon = 'fa-map-marker-alt';
    }
    
    if (asset.status === 'critical') {
        return '<i class="fas ' + icon + '" style="color: white; animation: pulse 1.5s infinite;"></i>';
    }
    return '<i class="fas ' + icon + '" style="color: white;"></i>';
}

function getMarkerColor(asset) {
    if (asset.status === 'critical') return 'marker-critical';
    if (asset.status === 'maintenance') return 'marker-maintenance';
    return 'marker-' + asset.type;
}

function createPopupContent(asset) {
    var statusClass = 'status-' + asset.status;
    var statusText = asset.status.charAt(0).toUpperCase() + asset.status.slice(1);
    var reportWarning = asset.reports >= 3 ? '🔔' : '';
    
    return '<div style="min-width: 280px;">' +
        '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">' +
        '<h3 style="margin:0; color:#2c3e50;">' + asset.name + 
        (asset.reports >= 5 ? ' ⚠️' : '') + '</h3>' +
        '<span class="' + statusClass + '" style="padding:4px 8px; border-radius:12px; font-size:11px;">' + statusText + '</span>' +
        '</div>' +
        
        '<div style="background:#f8f9fa; padding:8px; border-radius:6px; margin-bottom:10px;">' +
        '<div style="display:flex; gap:10px; justify-content:space-around;">' +
        '<div><i class="fas ' + getAssetIcon(asset) + '" style="color:#3498db;"></i> ' + asset.type + '</div>' +
        '<div><i class="fas fa-city" style="color:#e74c3c;"></i> ' + asset.city + '</div>' +
        '<div><i class="fas fa-exclamation-triangle" style="color:#f39c12;"></i> ' + asset.reports + '</div>' +
        '</div></div>' +
        
        (asset.description ? '<div style="background:#e8f4fd; padding:8px; border-radius:4px; margin-bottom:10px;">' +
        '<i class="fas fa-info-circle"></i> ' + asset.description + '</div>' : '') +
        
        '<div style="font-size:11px; margin-bottom:10px;">' +
        '<i class="fas fa-map-pin"></i> ' + (asset.address || asset.city) + '</div>' +
        
        '<div style="display:flex; gap:5px;">' +
        '<button onclick="editAsset(\'' + asset.id + '\')" ' +
        'style="flex:1; padding:8px; background:#3498db; color:white; border:none; border-radius:4px; cursor:pointer;">' +
        '<i class="fas fa-edit"></i> Edit</button>' +
        '<button onclick="simulateReport(\'' + asset.id + '\')" ' +
        'style="flex:1; padding:8px; background:#f39c12; color:white; border:none; border-radius:4px; cursor:pointer;">' +
        '<i class="fas fa-exclamation"></i> ' + (asset.reports > 0 ? asset.reports + '🔔' : 'Report') + '</button>' +
        '<button onclick="showDeleteConfirmation(\'' + asset.id + '\')" ' +
        'style="flex:1; padding:8px; background:#e74c3c; color:white; border:none; border-radius:4px; cursor:pointer;">' +
        '<i class="fas fa-trash"></i></button>' +
        '</div>' +
        '</div>';
}

function getAssetIcon(asset) {
    switch(asset.type) {
        case 'road': return 'fa-road';
        case 'utility': return 'fa-bolt';
        case 'facility': return 'fa-building';
        default: return 'fa-map-marker-alt';
    }
}

function updateVisibleStats() {
    var bounds = map.getBounds();
    var visible = 0;
    var critical = 0;
    
    for (var i = 0; i < assets.length; i++) {
        var a = assets[i];
        if (bounds.contains([a.lat, a.lng])) {
            visible++;
            if (a.status === 'critical') critical++;
        }
    }
    
    document.getElementById('visibleAssets').textContent = visible;
    document.getElementById('visibleCritical').textContent = critical;
}

// ==================== STATS RENDERING ====================
function renderStats() {
    var total = assets.length;
    var roads = assets.filter(function(a) { return a.type === 'road'; }).length;
    var utilities = assets.filter(function(a) { return a.type === 'utility'; }).length;
    var facilities = assets.filter(function(a) { return a.type === 'facility'; }).length;
    var critical = assets.filter(function(a) { return a.status === 'critical'; }).length;
    var maintenance = assets.filter(function(a) { return a.status === 'maintenance'; }).length;
    
    document.getElementById('totalAssets').textContent = total;
    document.getElementById('roadCount').textContent = roads;
    document.getElementById('utilityCount').textContent = utilities;
    document.getElementById('facilityCount').textContent = facilities;
    document.getElementById('criticalCount').textContent = critical;
    document.getElementById('maintenanceCount').textContent = maintenance;
    document.getElementById('assetCount').textContent = total;
    
    console.log('Stats updated:', {total, roads, utilities, facilities, critical, maintenance});
}

function renderAssetList() {
    var assetList = document.getElementById('assetList');
    if (!assetList) return;
    
    if (assets.length === 0) {
        assetList.innerHTML = '<div style="text-align:center; color:#7f8c8d; padding:40px;">' +
            '<i class="fas fa-map-marked-alt" style="font-size:48px; opacity:0.3;"></i>' +
            '<p>No infrastructure assets found</p>' +
            '<p style="font-size:12px;">Click on map to add your first asset!</p>' +
            '</div>';
        return;
    }
    
    // Filter assets
    var displayAssets = [];
    if (currentFilter === 'all') {
        displayAssets = assets;
    } else if (currentFilter === 'maintenance') {
        displayAssets = assets.filter(function(a) {
            return a.status === 'maintenance' || a.status === 'critical';
        });
    } else {
        displayAssets = assets.filter(function(a) {
            return a.type === currentFilter;
        });
    }
    
    // Sort by critical status first
    displayAssets.sort(function(a, b) {
        if (a.status === 'critical' && b.status !== 'critical') return -1;
        if (a.status !== 'critical' && b.status === 'critical') return 1;
        return a.city.localeCompare(b.city);
    });
    
    var html = '';
    for (var i = 0; i < displayAssets.length; i++) {
        var a = displayAssets[i];
        html += '<div class="asset-item ' + a.type + ' ' + (a.status === 'critical' ? 'critical' : '') + '" ' +
                'onclick="selectAsset(\'' + a.id + '\')" data-id="' + a.id + '">' +
            '<div class="asset-header">' +
            '<span class="asset-name">' + a.name + (a.reports >= 3 ? ' 🔔' : '') + '</span>' +
            '<span class="asset-status status-' + a.status + '">' + a.status + '</span>' +
            '</div>' +
            '<div class="asset-type">' +
            '<i class="fas ' + getAssetIcon(a) + '"></i> ' + a.type + ' • ' + a.city +
            '</div>' +
            '<div class="asset-actions" onclick="event.stopPropagation()">' +
            '<button class="edit-btn" onclick="editAsset(\'' + a.id + '\')"><i class="fas fa-edit"></i></button>' +
            '<button class="delete-btn" onclick="showDeleteConfirmation(\'' + a.id + '\')"><i class="fas fa-trash"></i></button>' +
            '</div>' +
            '</div>';
    }
    
    assetList.innerHTML = html;
    console.log('Asset list rendered, items:', displayAssets.length);
}

function highlightAssetInList(assetId) {
    var items = document.querySelectorAll('.asset-item');
    for (var i = 0; i < items.length; i++) {
        items[i].style.background = '';
    }
    
    var selected = document.querySelector('.asset-item[data-id="' + assetId + '"]');
    if (selected) {
        selected.style.background = '#e8f4fd';
        selected.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// ==================== CRUD OPERATIONS ====================
function selectAsset(assetId) {
    console.log('Selecting asset:', assetId);
    
    for (var i = 0; i < assets.length; i++) {
        if (assets[i].id === assetId) {
            var asset = assets[i];
            map.flyTo([asset.lat, asset.lng], 16, {
                animate: true,
                duration: 2
            });
            
            setTimeout(function() {
                markerCluster.eachLayer(function(layer) {
                    var latLng = layer.getLatLng();
                    if (latLng.lat === asset.lat && latLng.lng === asset.lng) {
                        layer.openPopup();
                    }
                });
            }, 2000);
            
            highlightAssetInList(assetId);
            showToast('📍 ' + asset.name, 'success');
            break;
        }
    }
}

function openAddModal() {
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Add Infrastructure Asset';
    document.getElementById('assetForm').reset();
    document.getElementById('assetId').value = '';
    
    if (selectedLocation) {
        document.getElementById('latitude').value = selectedLocation.lat.toFixed(6);
        document.getElementById('longitude').value = selectedLocation.lng.toFixed(6);
    }
    
    document.getElementById('assetModal').classList.add('show');
}

async function editAsset(assetId) {
    console.log('Editing asset:', assetId);
    
    for (var i = 0; i < assets.length; i++) {
        if (assets[i].id === assetId) {
            var a = assets[i];
            document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Asset';
            document.getElementById('assetId').value = a.id;
            document.getElementById('assetName').value = a.name;
            document.getElementById('assetType').value = a.type;
            document.getElementById('assetStatus').value = a.status;
            document.getElementById('assetCity').value = a.city;
            document.getElementById('assetWard').value = a.ward || '';
            document.getElementById('latitude').value = a.lat;
            document.getElementById('longitude').value = a.lng;
            document.getElementById('assetDescription').value = a.description || '';
            document.getElementById('assetModal').classList.add('show');
            break;
        }
    }
}

function showDeleteConfirmation(assetId) {
    deleteCandidateId = assetId;
    for (var i = 0; i < assets.length; i++) {
        if (assets[i].id === assetId) {
            document.getElementById('confirmMessage').textContent = 
                'Delete "' + assets[i].name + '" from ' + assets[i].city + '?';
            break;
        }
    }
    document.getElementById('confirmModal').classList.add('show');
}

async function deleteAsset() {
    if (!deleteCandidateId) return;
    
    // Try to delete from backend first
    const backendSuccess = await deleteAssetFromBackend(deleteCandidateId);
    
    if (backendSuccess) {
        // Remove from local array
        var newAssets = [];
        var deletedName = '';
        
        for (var i = 0; i < assets.length; i++) {
            if (assets[i].id === deleteCandidateId) {
                deletedName = assets[i].name;
            } else {
                newAssets.push(assets[i]);
            }
        }
        
        assets = newAssets;
        saveToLocalStorage();
        
        renderStats();
        renderAssetList();
        renderMarkers();
        
        closeConfirmModal();
        showToast('🗑️ Deleted ' + deletedName, 'success');
    } else {
        showToast('Failed to delete from server', 'error');
    }
    
    deleteCandidateId = null;
}

async function simulateReport(assetId) {
    // Try to add report to backend
    const backendSuccess = await addReportToBackend(assetId);
    
    if (backendSuccess) {
        // Refresh assets from backend
        await fetchAssetsFromBackend();
        renderStats();
        renderAssetList();
        renderMarkers();
        showToast('📢 Report added', 'success');
    } else {
        // Fallback to local update
        for (var i = 0; i < assets.length; i++) {
            if (assets[i].id === assetId) {
                var a = assets[i];
                a.reports = (a.reports || 0) + 1;
                
                if (a.reports >= 5 && a.status !== 'critical') {
                    a.status = 'critical';
                    showToast('⚠️ ' + a.name + ' marked CRITICAL!', 'warning');
                } else if (a.reports >= 3 && a.status !== 'maintenance') {
                    a.status = 'maintenance';
                    showToast('🔧 ' + a.name + ' moved to maintenance', 'warning');
                }
                
                a.lastUpdated = new Date().toISOString();
                saveToLocalStorage();
                
                renderStats();
                renderAssetList();
                renderMarkers();
                showToast('📢 Report added (' + a.reports + ' total)', 'success');
                break;
            }
        }
    }
}

// ==================== FORM HANDLING ====================
document.getElementById('assetForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    var assetId = document.getElementById('assetId').value;
    var lat = parseFloat(document.getElementById('latitude').value);
    var lng = parseFloat(document.getElementById('longitude').value);
    
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        showToast('Please set coordinates by clicking on map', 'error');
        return;
    }
    
    var city = document.getElementById('assetCity').value;
    if (!city) {
        showToast('Please select a city', 'error');
        return;
    }
    
    var assetData = {
        name: document.getElementById('assetName').value,
        type: document.getElementById('assetType').value,
        status: document.getElementById('assetStatus').value,
        city: city,
        ward: document.getElementById('assetWard').value,
        lat: lat,
        lng: lng,
        description: document.getElementById('assetDescription').value,
        reports: 0,
        lastUpdated: new Date().toISOString()
    };
    
    if (assetId) {
        // Update existing
        const result = await saveAssetToBackend(assetData, true, assetId);
        
        if (result.success) {
            // Refresh assets from backend
            await fetchAssetsFromBackend();
            showToast('✅ Asset updated', 'success');
        } else {
            // Fallback to local update
            for (var i = 0; i < assets.length; i++) {
                if (assets[i].id === assetId) {
                    assetData.reports = assets[i].reports;
                    assets[i] = { ...assets[i], ...assetData };
                    break;
                }
            }
            saveToLocalStorage();
            showToast('✅ Asset updated (local)', 'success');
        }
    } else {
        // Create new
        const result = await saveAssetToBackend(assetData, false);
        
        if (result.success) {
            // Refresh assets from backend
            await fetchAssetsFromBackend();
            showToast('✅ Asset created', 'success');
        } else {
            // Fallback to local
            assetData.id = Date.now().toString();
            assets.push(assetData);
            saveToLocalStorage();
            showToast('✅ Asset created (local)', 'success');
        }
    }
    
    closeModal();
    renderStats();
    renderAssetList();
    renderMarkers();
    clearSelectedLocation();
});

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    console.log('Setting up event listeners');
    
    // Filter buttons
    var filterBtns = document.querySelectorAll('.filter-btn');
    for (var i = 0; i < filterBtns.length; i++) {
        filterBtns[i].addEventListener('click', function(e) {
            var btns = document.querySelectorAll('.filter-btn');
            for (var j = 0; j < btns.length; j++) {
                btns[j].classList.remove('active');
            }
            this.classList.add('active');
            
            currentFilter = this.getAttribute('data-filter');
            renderAssetList();
            renderMarkers();
            showToast('Filter: ' + this.textContent, 'success');
        });
    }
    
    // City buttons
    var cityBtns = document.querySelectorAll('.city-btn');
    for (var i = 0; i < cityBtns.length; i++) {
        cityBtns[i].addEventListener('click', function(e) {
            var city = this.getAttribute('data-city');
            flyToCity(city);
        });
    }
    
    // Map control buttons
    var locateBtn = document.getElementById('locateUserBtn');
    if (locateBtn) locateBtn.addEventListener('click', getUserLocation);
    
    var fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFullscreen);
    
    var zoomInBtn = document.getElementById('zoomInBtn');
    if (zoomInBtn) zoomInBtn.addEventListener('click', zoomIn);
    
    var zoomOutBtn = document.getElementById('zoomOutBtn');
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', zoomOut);
    
    var resetViewBtn = document.getElementById('resetViewBtn');
    if (resetViewBtn) resetViewBtn.addEventListener('click', resetToIndiaView);
    
    // Location panel buttons
    var clearLocation = document.getElementById('clearLocation');
    if (clearLocation) clearLocation.addEventListener('click', clearSelectedLocation);
    
    var useLocation = document.getElementById('useLocationForAsset');
    if (useLocation) useLocation.addEventListener('click', useSelectedLocationForAsset);
    
    var copyCoords = document.getElementById('copyCoords');
    if (copyCoords) copyCoords.addEventListener('click', copyCoordinatesToClipboard);
    
    // Add asset button
    var showFormBtn = document.getElementById('showFormBtn');
    if (showFormBtn) showFormBtn.addEventListener('click', openAddModal);
    
    // Modal close buttons
    var closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    
    var cancelBtn = document.querySelector('.cancel-btn');
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    // Confirm modal buttons
    var confirmCancel = document.getElementById('confirmCancel');
    if (confirmCancel) confirmCancel.addEventListener('click', closeConfirmModal);
    
    var confirmDelete = document.getElementById('confirmDelete');
    if (confirmDelete) confirmDelete.addEventListener('click', deleteAsset);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal();
            closeConfirmModal();
        }
    });
    
    // Search functionality
    var searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            var searchTerm = e.target.value.toLowerCase();
            
            if (searchTerm === '') {
                var activeFilter = document.querySelector('.filter-btn.active');
                if (activeFilter) {
                    currentFilter = activeFilter.getAttribute('data-filter');
                }
                renderAssetList();
                renderMarkers();
                return;
            }
            
            // Filter assets based on search
            var filtered = assets.filter(function(asset) {
                return asset.name.toLowerCase().includes(searchTerm) ||
                       asset.city.toLowerCase().includes(searchTerm) ||
                       (asset.description && asset.description.toLowerCase().includes(searchTerm));
            });
            
            // Update list
            if (filtered.length === 0) {
                document.getElementById('assetList').innerHTML = 
                    '<div style="text-align:center; color:#7f8c8d; padding:30px;">' +
                    '<i class="fas fa-search" style="font-size:48px; opacity:0.3;"></i>' +
                    '<p>No assets found for "' + searchTerm + '"</p></div>';
            } else {
                // Create temporary list
                var html = '';
                for (var k = 0; k < filtered.length; k++) {
                    var a = filtered[k];
                    html += '<div class="asset-item ' + a.type + ' ' + (a.status === 'critical' ? 'critical' : '') + '" ' +
                            'onclick="selectAsset(\'' + a.id + '\')" data-id="' + a.id + '">' +
                        '<div class="asset-header">' +
                        '<span class="asset-name">' + a.name + '</span>' +
                        '<span class="asset-status status-' + a.status + '">' + a.status + '</span>' +
                        '</div>' +
                        '<div class="asset-type">' +
                        '<i class="fas ' + getAssetIcon(a) + '"></i> ' + a.city +
                        '</div>' +
                        '</div>';
                }
                document.getElementById('assetList').innerHTML = html;
            }
        });
    }
    
    console.log('Event listeners setup complete');
}

// ==================== LOCATION UTILITIES ====================
function copyCoordinatesToClipboard() {
    if (!selectedLocation) {
        showToast('No location selected', 'error');
        return;
    }
    
    var text = selectedLocation.lat.toFixed(6) + ', ' + selectedLocation.lng.toFixed(6);
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function() {
            showToast('📍 Coordinates copied!', 'success');
        });
    } else {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('📍 Coordinates copied!', 'success');
    }
}

function useSelectedLocationForAsset() {
    if (!selectedLocation) {
        showToast('Please select a location on the map first', 'error');
        return;
    }
    
    openAddModal();
}

// ==================== MODAL FUNCTIONS ====================
function closeModal() {
    document.getElementById('assetModal').classList.remove('show');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('show');
    deleteCandidateId = null;
}

// ==================== TOAST NOTIFICATION ====================
function showToast(message, type) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = 'toast show ' + (type || 'success');
    
    setTimeout(function() {
        toast.classList.remove('show');
    }, 3000);
}

// ==================== UTILITY FUNCTIONS ====================
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

function zoomIn() {
    map.zoomIn();
}

function zoomOut() {
    map.zoomOut();
}
assets = sampleAssets.slice();
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, initializing with sample data');
    assets = sampleAssets.slice();
    renderStats();
    renderAssetList();
    if (map) {
        renderMarkers();
    }
});
// ==================== EXPORT GLOBAL FUNCTIONS ====================
window.editAsset = editAsset;
window.simulateReport = simulateReport;
window.selectAsset = selectAsset;
window.showDeleteConfirmation = showDeleteConfirmation;
window.useSelectedLocationForAsset = useSelectedLocationForAsset;
window.copyCoordinatesToClipboard = copyCoordinatesToClipboard;
window.flyToCity = flyToCity;
window.resetToIndiaView = resetToIndiaView;