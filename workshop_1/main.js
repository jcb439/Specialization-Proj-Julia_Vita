// Global variables
let scene, camera, renderer, controls;
let nodes = new Map();
let edges = [];
let nodeData = [];
let edgeData = [];
let animationSpeed = 1;
let isPaused = false;
let selectedNode = null;

// Color mapping for categories
const categoryColors = {
    'Human Actors': '#FF6B6B',
    'Non-Human Entities': '#4ECDC4', 
    'Ethics of Care': '#FF9FF3',
    'Gamification': '#A9DFBF',
    'Environmental Impact': '#FAD7A0',
    'Relational Dynamics': '#F9E79F',
    'Tensions': '#FADBD8',
    'Emergent Properties': '#E74C3C'
};

// Initialize the application
function init() {
    setupScene();
    setupEventListeners();
    loadCSVData();
}

// Setup Three.js scene
function setupScene() {
    const container = document.getElementById('visualization-container');
    const canvas = document.getElementById('three-canvas');
    
    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 100, 1000);
    
    // Camera
    camera = new THREE.PerspectiveCamera(
        75, 
        container.clientWidth / container.clientHeight, 
        0.1, 
        2000
    );
    camera.position.set(100, 100, 100);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ 
        canvas: canvas,
        antialias: true,
        alpha: true 
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    // Point lights for atmosphere
    const pointLight1 = new THREE.PointLight(0x3498db, 0.5, 200);
    pointLight1.position.set(50, 50, 50);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xe74c3c, 0.5, 200);
    pointLight2.position.set(-50, -50, -50);
    scene.add(pointLight2);
    
    // Mouse controls simulation
    setupMouseControls();
    
    // Start render loop
    animate();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

// Setup mouse controls for camera
function setupMouseControls() {
    const canvas = document.getElementById('three-canvas');
    let mouseX = 0, mouseY = 0;
    let isMouseDown = false;
    let targetRotationX = 0, targetRotationY = 0;
    let rotationX = 0, rotationY = 0;
    
    canvas.addEventListener('mousedown', (event) => {
        isMouseDown = true;
        mouseX = event.clientX;
        mouseY = event.clientY;
    });
    
    canvas.addEventListener('mouseup', () => {
        isMouseDown = false;
    });
    
    canvas.addEventListener('mousemove', (event) => {
        if (isMouseDown) {
            const deltaX = event.clientX - mouseX;
            const deltaY = event.clientY - mouseY;
            
            targetRotationY += deltaX * 0.01;
            targetRotationX += deltaY * 0.01;
            
            mouseX = event.clientX;
            mouseY = event.clientY;
        } else {
            // Check for node intersection
            checkNodeIntersection(event);
        }
    });
    
    // Zoom with mouse wheel
    canvas.addEventListener('wheel', (event) => {
        event.preventDefault();
        const delta = event.deltaY > 0 ? 1.1 : 0.9;
        camera.position.multiplyScalar(delta);
    });
    
    // Update camera rotation in animation loop
    window.updateCameraRotation = () => {
        if (!isPaused) {
            // Auto rotation
            targetRotationY += 0.005 * animationSpeed;
        }
        
        rotationX += (targetRotationX - rotationX) * 0.05;
        rotationY += (targetRotationY - rotationY) * 0.05;
        
        const radius = camera.position.length();
        camera.position.x = radius * Math.sin(rotationY) * Math.cos(rotationX);
        camera.position.y = radius * Math.sin(rotationX);
        camera.position.z = radius * Math.cos(rotationY) * Math.cos(rotationX);
        camera.lookAt(0, 0, 0);
    };
}

// Check for node intersections on mouse move
function checkNodeIntersection(event) {
    const canvas = document.getElementById('three-canvas');
    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    const nodeObjects = Array.from(nodes.values()).map(node => node.mesh);
    const intersects = raycaster.intersectObjects(nodeObjects);
    
    if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        const nodeId = intersectedObject.userData.nodeId;
        selectNode(nodeId);
        canvas.style.cursor = 'pointer';
    } else {
        canvas.style.cursor = 'grab';
        if (selectedNode) {
            resetNodeHighlight(selectedNode);
            selectedNode = null;
            updateNodeDetails(null);
        }
    }
}

// Load CSV data
async function loadCSVData() {
    try {
        document.getElementById('loading').style.display = 'block';
        
        const response = await fetch('ontology-data.csv');
        const csvText = await response.text();
        
        parseCSV(csvText);
        createNetworkVisualization();
        
        document.getElementById('loading').style.display = 'none';
        updateStats();
        
    } catch (error) {
        console.error('Error loading CSV data:', error);
        document.getElementById('loading').innerHTML = 'Error loading data. Please check the CSV file.';
    }
}

// Parse CSV data
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === headers.length) {
            const nodeObj = {};
            headers.forEach((header, index) => {
                nodeObj[header.trim()] = values[index].trim();
            });
            
            // Convert numeric values
            nodeObj.size = parseFloat(nodeObj.size) || 5;
            nodeObj.x = parseFloat(nodeObj.x) || 0;
            nodeObj.y = parseFloat(nodeObj.y) || 0;
            nodeObj.z = parseFloat(nodeObj.z) || 0;
            
            nodeData.push(nodeObj);
        }
    }
}

// Parse CSV line handling quotes and commas
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

// Create network visualization
function createNetworkVisualization() {
    createNodes();
    createConnections();
}

// Create 3D nodes
function createNodes() {
    nodeData.forEach(nodeInfo => {
        const geometry = new THREE.SphereGeometry(nodeInfo.size / 2, 16, 16);
        
        const material = new THREE.MeshPhongMaterial({
            color: nodeInfo.color,
            transparent: true,
            opacity: 0.8,
            shininess: 100
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(nodeInfo.x, nodeInfo.y, nodeInfo.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = {
            nodeId: nodeInfo.id,
            nodeInfo: nodeInfo
        };
        
        // Create text label
        const labelGeometry = new THREE.PlaneGeometry(20, 4);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;
        
        context.fillStyle = 'rgba(255, 255, 255, 0.9)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#333';
        context.font = '24px Arial';
        context.textAlign = 'center';
        context.fillText(nodeInfo.label, canvas.width / 2, canvas.height / 2 + 8);
        
        const labelTexture = new THREE.CanvasTexture(canvas);
        const labelMaterial = new THREE.MeshBasicMaterial({
            map: labelTexture,
            transparent: true,
            opacity: 0.8
        });
        
        const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
        labelMesh.position.copy(mesh.position);
        labelMesh.position.y += nodeInfo.size + 5;
        labelMesh.lookAt(camera.position);
        
        const nodeGroup = new THREE.Group();
        nodeGroup.add(mesh);
        nodeGroup.add(labelMesh);
        
        nodes.set(nodeInfo.id, {
            mesh: mesh,
            label: labelMesh,
            group: nodeGroup,
            info: nodeInfo
        });
        
        scene.add(nodeGroup);
    });
}

// Create connections between nodes (simplified for demo)
function createConnections() {
    // Create some sample connections based on categories
    const nodeArray = Array.from(nodes.values());
    
    for (let i = 0; i < nodeArray.length; i++) {
        for (let j = i + 1; j < nodeArray.length; j++) {
            if (Math.random() < 0.1) { // 10% chance of connection
                const node1 = nodeArray[i];
                const node2 = nodeArray[j];
                
                const points = [
                    node1.mesh.position,
                    node2.mesh.position
                ];
                
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.LineBasicMaterial({
                    color: 0x666666,
                    transparent: true,
                    opacity: 0.3
                });
                
                const line = new THREE.Line(geometry, material);
                edges.push(line);
                scene.add(line);
            }
        }
    }
}

// Select and highlight a node
function selectNode(nodeId) {
    if (selectedNode && selectedNode !== nodeId) {
        resetNodeHighlight(selectedNode);
    }
    
    selectedNode = nodeId;
    const node = nodes.get(nodeId);
    
    if (node) {
        // Highlight the selected node
        node.mesh.material.emissive = new THREE.Color(0x444444);
        node.mesh.scale.setScalar(1.5);
        
        // Update UI
        updateNodeDetails(node.info);
    }
}

// Reset node highlight
function resetNodeHighlight(nodeId) {
    const node = nodes.get(nodeId);
    if (node) {
        node.mesh.material.emissive = new THREE.Color(0x000000);
        node.mesh.scale.setScalar(1);
    }
}

// Update node details in UI
function updateNodeDetails(nodeInfo) {
    const detailsDiv = document.getElementById('node-details');
    
    if (nodeInfo) {
        detailsDiv.innerHTML = `
            <h4>${nodeInfo.label}</h4>
            <p><strong>Category:</strong> ${nodeInfo.category}</p>
            <p><strong>Type:</strong> ${nodeInfo.type}</p>
            <p><strong>Description:</strong> ${nodeInfo.description}</p>
        `;
    } else {
        detailsDiv.innerHTML = '<p>Click on a node to see details</p>';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Category filter
    document.getElementById('categoryFilter').addEventListener('change', (e) => {
        filterNodes('category', e.target.value);
    });
    
    // Type filter
    document.getElementById('typeFilter').addEventListener('change', (e) => {
        filterNodes('type', e.target.value);
    });
    
    // Speed slider
    const speedSlider = document.getElementById('speedSlider');
    const speedValue = document.getElementById('speedValue');
    speedSlider.addEventListener('input', (e) => {
        animationSpeed = parseFloat(e.target.value);
        speedValue.textContent = animationSpeed.toFixed(1);
    });
    
    // Pause button
    document.getElementById('pauseBtn').addEventListener('click', () => {
        isPaused = !isPaused;
        document.getElementById('pauseBtn').textContent = isPaused ? 'Resume Rotation' : 'Pause Rotation';
    });
    
    // Reset button
    document.getElementById('resetBtn').addEventListener('click', resetView);
}

// Filter nodes by category or type
function filterNodes(filterType, value) {
    nodes.forEach((node, nodeId) => {
        const shouldShow = value === 'all' || node.info[filterType] === value;
        node.group.visible = shouldShow;
    });
    
    // Update edge visibility based on visible nodes
    edges.forEach(edge => {
        edge.visible = true; // Simplified - you might want more complex logic
    });
    
    updateStats();
}

// Reset camera view
function resetView() {
    camera.position.set(100, 100, 100);
    camera.lookAt(0, 0, 0);
    
    if (selectedNode) {
        resetNodeHighlight(selectedNode);
        selectedNode = null;
        updateNodeDetails(null);
    }
}

// Update statistics
function updateStats() {
    const visibleNodes = Array.from(nodes.values()).filter(node => node.group.visible).length;
    const visibleEdges = edges.filter(edge => edge.visible).length;
    
    document.getElementById('node-count').textContent = visibleNodes;
    document.getElementById('edge-count').textContent = visibleEdges;
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update camera rotation
    if (window.updateCameraRotation) {
        window.updateCameraRotation();
    }
    
    // Animate nodes
    if (!isPaused) {
        nodes.forEach((node, nodeId) => {
            // Gentle floating animation
            const time = Date.now() * 0.001 * animationSpeed;
            const floatOffset = Math.sin(time + parseInt(nodeId) * 0.1) * 2;
            node.mesh.position.y = node.info.y + floatOffset;
            
            // Rotate labels to face camera
            node.label.lookAt(camera.position);
        });
    }
    
    renderer.render(scene, camera);
}

// Handle window resize
function onWindowResize() {
    const container = document.getElementById('visualization-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);