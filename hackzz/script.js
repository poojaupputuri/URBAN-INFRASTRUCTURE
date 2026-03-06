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
let currentUser = null;

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Indian cities with precise coordinates
const indianCities = {
    delhi: { lat: 28.6139, lng: 77.2090, zoom: 14, name: 'Delhi-NCR' },
    mumbai: { lat: 19.0760, lng: 72.8777, zoom: 14, name: 'Mumbai' },
    bangalore: { lat: 12.9716, lng: 77.5946, zoom: 14, name: 'Bengaluru' },
    chennai: { lat: 13.0827, lng: 80.2707, zoom: 14, name: 'Chennai' },
    kolkata: { lat: 22.5726, lng: 88.3639, zoom: 14, name: 'Kolkata' },
    hyderabad: { lat: 17.3850, lng: 78.4867, zoom: 14, name: 'Hyderabad' },
    pune: { lat: 18.5204, lng: 73.8567, zoom: 14, name: 'Pune' },
    ahmedabad: { lat: 23.0225, lng: 72.5714, zoom: 14, name: 'Ahmedabad' },
    jaipur: { lat: 26.9124, lng: 75.7873, zoom: 14, name: 'Jaipur' },
    lucknow: { lat: 26.8467, lng: 80.9462, zoom: 14, name: 'Lucknow' }
};

// ==================== AUTHENTICATION ====================

// Check authentication on load
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
        window.location.href = 'login.html';
        return;
    }

    try {
        currentUser = JSON.parse(user);
        updateUserInfo();
        console.log('User authenticated:', currentUser);
        initializeApp();
    } catch (error) {
        console.error('Error parsing user data:', error);
        window.location.href = 'login.html';
    }
});

function updateUserInfo() {
    document.getElementById('userName').textContent = currentUser.username;
    
    let roleText = currentUser.role === 'admin' ? 'Administrator' :
                   currentUser.role === 'city_planner' ? 'City Planner' : 'User';
    
    if (currentUser.city) {
        roleText += ` (${currentUser.city})`;
    }
    
    document.getElementById('userRole').textContent = roleText;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// ==================== API FUNCTIONS ====================

async function fetchAssetsFromBackend() {
    try {
        console.log('Fetching assets from backend...');
        
        const response = await fetch(`${API_BASE_URL}/assets`);
        const result = await response.json();
        
        if (result.success && result.data) {
            assets = result.data;
            console.log(`✅ Loaded ${assets.length} assets from backend`);
            
            // Update city badges with asset counts
            updateCityBadges();
            
            return true;
        } else {
            console.warn('Backend returned no data');
            return false;
        }
    } catch (error) {
        console.error('Error fetching from backend:', error);
        return false;
    }
}

function updateCityBadges() {
    // Count assets per city
    const cityCounts = {};
    assets.forEach(asset => {
        cityCounts[asset.city] = (cityCounts[asset.city] || 0) + 1;
    });

    // Update city button badges
    document.querySelectorAll('.city-btn').forEach(btn => {
        const city = btn.getAttribute('data-city');
        const cityName = 
            city === 'delhi' ? 'Delhi' :
            city === 'mumbai' ? 'Mumbai' :
            city === 'bangalore' ? 'Bangalore' :
            city === 'chennai' ? 'Chennai' :
            city === 'kolkata' ? 'Kolkata' :
            city === 'hyderabad' ? 'Hyderabad' :
            city === 'pune' ? 'Pune' :
            city === 'ahmedabad' ? 'Ahmedabad' :
            city === 'jaipur' ? 'Jaipur' :
            city === 'lucknow' ? 'Lucknow' : '';
        
        const count = cityCounts[cityName] || 0;
        const badge = btn.querySelector('.city-badge');
        if (badge) {
            badge.textContent = `${count} assets`;
        }
    });
}

async function createAsset(assetData) {
    try {
        const response = await fetch(`${API_BASE_URL}/assets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(assetData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('✅ Asset created successfully', 'success');
            await fetchAssetsFromBackend(); // Refresh assets
            renderStats();
            renderAssetList();
            renderMarkers(); // Re-render markers with new asset
            return true;
        } else {
            showToast('❌ ' + (result.message || 'Error creating asset'), 'error');
            return false;
        }
    } catch (error) {
        console.error('Error creating asset:', error);
        showToast('❌ Failed to connect to server', 'error');
        return false;
    }
}

async function updateAsset(id, assetData) {
    try {
        const response = await fetch(`${API_BASE_URL}/assets/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(assetData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('✅ Asset updated successfully', 'success');
            await fetchAssetsFromBackend(); // Refresh assets
            renderStats();
            renderAssetList();
            renderMarkers(); // Re-render markers with updated asset
            return true;
        } else {
            showToast('❌ ' + (result.message || 'Error updating asset'), 'error');
            return false;
        }
    } catch (error) {
        console.error('Error updating asset:', error);
        showToast('❌ Failed to connect to server', 'error');
        return false;
    }
}

async function deleteAssetFromServer(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/assets/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('🗑️ Asset deleted successfully', 'success');
            await fetchAssetsFromBackend(); // Refresh assets
            renderStats();
            renderAssetList();
            renderMarkers(); // Re-render markers after deletion
            return true;
        } else {
            showToast('❌ ' + (result.message || 'Error deleting asset'), 'error');
            return false;
        }
    } catch (error) {
        console.error('Error deleting asset:', error);
        showToast('❌ Failed to connect to server', 'error');
        return false;
    }
}

async function addReport(assetId) {
    try {
        const response = await fetch(`${API_BASE_URL}/assets/${assetId}/report`, {
            method: 'PATCH'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('📢 Report added', 'success');
            await fetchAssetsFromBackend(); // Refresh assets
            renderStats();
            renderAssetList();
            renderMarkers(); // Re-render markers with updated status
            return true;
        } else {
            showToast('❌ ' + (result.message || 'Error adding report'), 'error');
            return false;
        }
    } catch (error) {
        console.error('Error adding report:', error);
        showToast('❌ Failed to connect to server', 'error');
        return false;
    }
}

// ==================== INITIALIZATION ====================
async function initializeApp() {
    console.log('Initializing application...');
    
    const backendSuccess = await fetchAssetsFromBackend();
    
    if (!backendSuccess) {
        showToast('⚠️ Using sample data (backend unavailable)', 'warning');
        // Use sample data if needed
    }
    
    initMap();
    renderStats();
    renderAssetList();
    renderMarkers(); // Initial marker render
    setupEventListeners();
    updateTimestamp();
    setInterval(updateTimestamp, 60000);
    
    // Hide selected location panel initially
    var panel = document.getElementById('selectedLocationPanel');
    if (panel) panel.style.display = 'none';
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

    // Initialize marker cluster
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

    map.on('moveend', updateVisibleStats);
    map.on('locationfound', handleLocationFound);
    map.on('locationerror', handleLocationError);

    console.log('Map initialized successfully');
}

function setSelectedLocation(lat, lng) {
    console.log('Setting selected location:', lat, lng);
    
    selectedLocation = { lat: lat, lng: lng };
    
    document.getElementById('selectedLat').textContent = lat.toFixed(6);
    document.getElementById('selectedLng').textContent = lng.toFixed(6);
    document.getElementById('selectedLocationPanel').style.display = 'block';
    
    document.getElementById('latitude').value = lat.toFixed(6);
    document.getElementById('longitude').value = lng.toFixed(6);
    
    if (selectedLocationMarker) {
        map.removeLayer(selectedLocationMarker);
    }
    
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
    markers = [];
    
    // Filter assets based on current filter
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
    
    // Create markers for each asset
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
        markers.push(marker);
    }
    
    updateVisibleStats();
    console.log('Markers rendered successfully');
}

function getMarkerIcon(asset) {
    const icons = {
        road: 'fa-road',
        utility: 'fa-bolt',
        facility: 'fa-building',
        railway: 'fa-train',
        airport: 'fa-plane',
        smart_pole: 'fa-lightbulb'
    };
    
    const icon = icons[asset.type] || 'fa-map-marker-alt';
    
    if (asset.status === 'critical') {
        return '<i class="fas ' + icon + '" style="color: white; animation: pulse-marker 1.5s infinite;"></i>';
    }
    return '<i class="fas ' + icon + '" style="color: white;"></i>';
}

function getMarkerColor(asset) {
    if (asset.status === 'critical') return 'marker-critical';
    if (asset.status === 'maintenance') return 'marker-maintenance';
    
    const colors = {
        road: 'marker-road',
        utility: 'marker-utility',
        facility: 'marker-facility',
        railway: 'marker-railway',
        airport: 'marker-airport',
        smart_pole: 'marker-smart_pole'
    };
    
    return colors[asset.type] || 'marker-road';
}

function createPopupContent(asset) {
    var statusClass = 'status-' + asset.status;
    var statusText = asset.status.charAt(0).toUpperCase() + asset.status.slice(1);
    
    // Permission checks
    const canEdit = currentUser.role === 'admin' || 
                   (currentUser.role === 'city_planner' && currentUser.city === asset.city) ||
                   (currentUser.role === 'user' && asset.createdBy === currentUser.id);
    
    const canDelete = currentUser.role === 'admin' || 
                     (currentUser.role === 'city_planner' && currentUser.city === asset.city);
    
    var popup = '<div style="min-width: 280px;">' +
        '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">' +
        '<h3 style="margin:0; color:#2c3e50;">' + asset.name + 
        (asset.reports >= 5 ? ' ⚠️' : '') + '</h3>' +
        '<span class="' + statusClass + '" style="padding:4px 8px; border-radius:12px; font-size:11px;">' + statusText + '</span>' +
        '</div>' +
        
        '<div style="background:#f8f9fa; padding:8px; border-radius:6px; margin-bottom:10px;">' +
        '<div style="display:flex; gap:10px; justify-content:space-around;">' +
        '<div><i class="fas ' + getAssetIcon(asset) + '" style="color:#3498db;"></i> ' + asset.type + '</div>' +
        '<div><i class="fas fa-city" style="color:#e74c3c;"></i> ' + asset.city + '</div>' +
        '<div><i class="fas fa-exclamation-triangle" style="color:#f39c12;"></i> ' + asset.reports + ' reports</div>' +
        '</div></div>' +
        
        (asset.description ? '<div style="background:#e8f4fd; padding:8px; border-radius:4px; margin-bottom:10px;">' +
        '<i class="fas fa-info-circle"></i> ' + asset.description + '</div>' : '') +
        
        '<div style="font-size:11px; margin-bottom:10px;">' +
        '<i class="fas fa-map-pin"></i> ' + (asset.address || asset.city) + '</div>' +
        
        '<div style="font-size:10px; color:#7f8c8d; margin-bottom:10px;">' +
        '<i class="fas fa-clock"></i> ' + new Date(asset.lastUpdated).toLocaleString() + '</div>' +
        
        '<div style="display:flex; gap:5px;">';
    
    // Edit button
    if (canEdit) {
        popup += '<button onclick="editAsset(\'' + asset.id + '\')" ' +
            'style="flex:1; padding:8px; background:#3498db; color:white; border:none; border-radius:4px; cursor:pointer;">' +
            '<i class="fas fa-edit"></i> Edit</button>';
    }
    
    // Report button (always visible)
    popup += '<button onclick="simulateReport(\'' + asset.id + '\')" ' +
        'style="flex:1; padding:8px; background:#f39c12; color:white; border:none; border-radius:4px; cursor:pointer;">' +
        '<i class="fas fa-exclamation"></i> Report</button>';
    
    // Delete button
    if (canDelete) {
        popup += '<button onclick="showDeleteConfirmation(\'' + asset.id + '\')" ' +
            'style="flex:1; padding:8px; background:#e74c3c; color:white; border:none; border-radius:4px; cursor:pointer;">' +
            '<i class="fas fa-trash"></i></button>';
    }
    
    popup += '</div>' +
        '</div>';
    
    return popup;
}

function getAssetIcon(asset) {
    const icons = {
        road: 'fa-road',
        utility: 'fa-bolt',
        facility: 'fa-building',
        railway: 'fa-train',
        airport: 'fa-plane',
        smart_pole: 'fa-lightbulb'
    };
    return icons[asset.type] || 'fa-map-marker-alt';
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
    var roads = assets.filter(a => a.type === 'road').length;
    var utilities = assets.filter(a => a.type === 'utility').length;
    var facilities = assets.filter(a => a.type === 'facility').length;
    var railways = assets.filter(a => a.type === 'railway').length;
    var airports = assets.filter(a => a.type === 'airport').length;
    var smartPoles = assets.filter(a => a.type === 'smart_pole').length;
    var critical = assets.filter(a => a.status === 'critical').length;
    var maintenance = assets.filter(a => a.status === 'maintenance').length;
    
    document.getElementById('totalAssets').textContent = total;
    document.getElementById('roadCount').textContent = roads;
    document.getElementById('utilityCount').textContent = utilities;
    document.getElementById('facilityCount').textContent = facilities;
    document.getElementById('railwayCount').textContent = railways;
    document.getElementById('airportCount').textContent = airports;
    document.getElementById('smartPoleCount').textContent = smartPoles;
    document.getElementById('criticalCount').textContent = critical;
    document.getElementById('maintenanceCount').textContent = maintenance;
    document.getElementById('assetCount').textContent = total;
}

function renderAssetList() {
    var assetList = document.getElementById('assetList');
    if (!assetList) return;
    
    if (assets.length === 0) {
        assetList.innerHTML = '<div style="text-align:center; color:#7f8c8d; padding:40px;">' +
            '<i class="fas fa-map-marked-alt" style="font-size:48px; opacity:0.3;"></i>' +
            '<p>No infrastructure assets found</p>' +
            '<p style="font-size:12px;">Click "Add New Asset" to create your first asset!</p>' +
            '</div>';
        return;
    }
    
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
}

function selectAsset(assetId) {
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
            
            showToast('📍 ' + asset.name, 'success');
            break;
        }
    }
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

function editAsset(assetId) {
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
    await deleteAssetFromServer(deleteCandidateId);
    closeConfirmModal();
    deleteCandidateId = null;
}

async function simulateReport(assetId) {
    await addReport(assetId);
}

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
        description: document.getElementById('assetDescription').value
    };
    
    if (assetId) {
        await updateAsset(assetId, assetData);
    } else {
        await createAsset(assetData);
    }
    
    closeModal();
    clearSelectedLocation();
});

function setupEventListeners() {
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
    if (useLocation) useLocation.addEventListener('click', openAddModal);
    
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
            
            var filtered = assets.filter(function(asset) {
                return asset.name.toLowerCase().includes(searchTerm) ||
                       asset.city.toLowerCase().includes(searchTerm) ||
                       asset.type.toLowerCase().includes(searchTerm) ||
                       (asset.description && asset.description.toLowerCase().includes(searchTerm));
            });
            
            if (filtered.length === 0) {
                document.getElementById('assetList').innerHTML = 
                    '<div style="text-align:center; color:#7f8c8d; padding:30px;">' +
                    '<i class="fas fa-search" style="font-size:48px; opacity:0.3;"></i>' +
                    '<p>No assets found for "' + searchTerm + '"</p></div>';
            } else {
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
}

function copyCoordinatesToClipboard() {
    if (!selectedLocation) {
        showToast('No location selected', 'error');
        return;
    }
    
    var text = selectedLocation.lat.toFixed(6) + ', ' + selectedLocation.lng.toFixed(6);
    
    navigator.clipboard.writeText(text).then(function() {
        showToast('📍 Coordinates copied!', 'success');
    });
}

function closeModal() {
    document.getElementById('assetModal').classList.remove('show');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('show');
    deleteCandidateId = null;
}

function showToast(message, type) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = 'toast show ' + (type || 'success');
    
    setTimeout(function() {
        toast.classList.remove('show');
    }, 3000);
}

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

// Make functions globally available
window.editAsset = editAsset;
window.simulateReport = simulateReport;
window.selectAsset = selectAsset;
window.showDeleteConfirmation = showDeleteConfirmation;
window.useSelectedLocationForAsset = openAddModal;
window.copyCoordinatesToClipboard = copyCoordinatesToClipboard;
window.flyToCity = flyToCity;
window.resetToIndiaView = resetToIndiaView;
window.logout = logout;