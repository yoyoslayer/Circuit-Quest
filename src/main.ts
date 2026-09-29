import * as T from 'three';
import {createRenderer,toon} from './render/toon';
import './style.css';
const {scene,camera,effect}=createRenderer(document.querySelector('canvas')!);
const floor=new T.Mesh(new T.BoxGeometry(20,.3,20),toon('#91a7af'));floor.receiveShadow=true;scene.add(floor);
const box=new T.Mesh(new T.BoxGeometry(1,1,1),toon('#ffbe46'));box.position.y=1;box.castShadow=true;scene.add(box);
camera.position.set(13,17,20);camera.lookAt(0,0,0);
document.body.dataset.ready='true';
function frame(){requestAnimationFrame(frame);effect.render(scene,camera);}frame();
