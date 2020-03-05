import './style.css';
import * as THREE from 'three';
import OrbitControls from 'orbit-controls-es6';
import map from './assets/map.svg';

/** Parse SVG */
document.querySelector('#map').innerHTML = map;
let arr = [];
let p = document.querySelectorAll('#map svg polygon')
p.forEach((polygon) => {
    let pts = polygon.getAttribute('points');
    pts = pts.trim()
    pts = pts.split(' ');
    for (let i = 0; i < pts.length; i++) {
        pts[i] = parseFloat(pts[i])
    }
    let newArr = pts.reduce(function(result, value, index, array) {
        if (index % 2 === 0) {
            result.push(array.slice(index, index + 2));
        }
        return result;
      }, []);
    let n = [];
    newArr.forEach((pt) => {
        let v = new THREE.Vector2(pt[0], pt[1])
        n.push(v)
    })
    arr.push(n);
})

/** THREE */

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize(window.innerWidth, window.innerHeight);
document.querySelector('#render').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const perspective = window.innerWidth;
const fov = 180 * ( 2 * Math.atan( window.innerHeight / 2 / perspective ) ) / Math.PI
const camera = new THREE.PerspectiveCamera( fov, window.innerWidth / window.innerHeight, 1, 10000 );

camera.position.set(0, perspective, 0);
camera.up = new THREE.Vector3(0,0,-1);
camera.lookAt(new THREE.Vector3(0,-1,0));

const controls = new OrbitControls(camera, renderer.domElement);

let light = new THREE.AmbientLight( 0x999999 ); // soft white light
scene.add( light );
let directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
scene.add( directionalLight );
directionalLight.position.y = 10;

let texture = new THREE.TextureLoader().load(require('./assets/img/moyo_purple_small.png'));

let geometry = new THREE.CylinderGeometry( 200, 120, 100, 40, 1);
let material = new THREE.MeshLambertMaterial({color: '#9165ba'});
let base = new THREE.Mesh( geometry, material );
scene.add( base );
base.position.y = -50
base.name = 'base';

let geo = new THREE.CylinderGeometry( 200, 200, 5, 40, 1);
let mat = new THREE.MeshPhongMaterial( { map: texture } );
let top = new THREE.Mesh( geo, mat );
top.name = 'top';
scene.add( top );
top.position.y = 2.5
top.rotation.y = Math.PI/2;

let o = new THREE.Object3D();

arr.forEach((s, i) => {
    let shape = new THREE.Shape(s);
    let g = new THREE.ExtrudeGeometry(shape, { amount: 8, bevelEnabled: false, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 });
    let m = new THREE.Mesh(g, new THREE.MeshPhongMaterial({
        transparent: true,
        opacity: 0.2
    }));
    m.name = `pad_${i}`; 
    m.rotation.x = Math.PI/2;
    scene.add(m);
    o.add(m);
})

scene.add(o);
o.position.x = -200;
o.position.z = -200;
o.position.y = 10;

const raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let activeName = null;
let mouseDown = false;
let activePad = document.querySelector('#activePad');
let activeDistance = document.querySelector('#activeDistance')

const resize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

resize()

window.addEventListener('resize', () => {
    resize();
});

window.addEventListener('mousemove', () => {
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
})

window.addEventListener('mousedown', () => {
    mouseDown = true;
})

window.addEventListener('mouseup', () => {
    mouseDown = false;
})
window.addEventListener('mouseleave', () => {
    mouseDown = false;
})

const raycast = () => {
    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.origin.set(mouse.x, mouse.y, - 1 ).unproject(camera);
    let intersects = raycaster.intersectObjects(o.children);
    if (!intersects.length) {
        activeName = null;
        activePad.innerText = 'None';
    }
	for (let i = 0; i < intersects.length; i++) {
        activeName = intersects[i].object.name;
        activePad.innerText = intersects[i].object.name.replace('pad_','');
        
        /*intersects[i].object.geometry.computeBoundingBox();
        let c = intersects[i].object.geometry.boundingBox.getCenter();
        console.log(c.x, c.z)
        let d = c.distanceTo(intersects[i].point);
        console.log(d)*/

	}
}


const animate = () => {
    requestAnimationFrame(animate);
    raycast();
    for (let i = 0; i < o.children.length; i++) {
        if (o.children[i].name === activeName) {
            if (mouseDown) {
                o.children[i].material.color.set( 0x0000ff);
            } else {
                o.children[i].material.color.set( 0xff0000);
            }
        } else {
            o.children[i].material.color.set( 0x00ff00);
        }
    }
    renderer.render(scene, camera);
};

animate();