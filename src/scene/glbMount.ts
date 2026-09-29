import {
  Box3,
  BoxGeometry,
  Color,
  Group,
  LOD,
  Mesh,
  MeshStandardMaterial,
  Vector3,
  type Object3D,
} from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { heightUnits, project } from "../lib/geo3d"
import { PLACE_BY_ID } from "../data/places"

/** Real heights in metres — used to scale generated meshes onto the tangent plane. */
export const LANDMARK_HEIGHT_M: Record<string, number> = {
  "india-gate": 42,
  "qutub-minar": 72.5,
  "red-fort": 33,
  lotus: 34,
  humayun: 47,
  akshardham: 43,
  rashtrapati: 55,
  "jama-masjid": 41,
  jantar: 27,
  safdarjung: 37,
}

/** Baked GLBs in /public/models. Facade of each source mesh faces +Z. */
export const BAKED_GLB: Record<string, string> = {
  "india-gate": "/models/india-gate.glb",
  "qutub-minar": "/models/qutub-minar.glb",
  "red-fort": "/models/red-fort.glb",
  lotus: "/models/lotus.glb",
  humayun: "/models/humayun.glb",
  "jama-masjid": "/models/jama-masjid.glb",
}

/**
 * Yaw that takes a +Z facade into world heading.
 * East=+X, North=−Z. India Gate and Lahori Gate face west (−X);
 * Jama Masjid's prayer-hall iwan faces the courtyard to the east (+X);
 * Humayun's Tomb is approached from the south (+Z).
 */
export const LANDMARK_YAW: Record<string, number> = {
  "india-gate": -Math.PI / 2,
  "red-fort": -Math.PI / 2,
  "qutub-minar": 0,
  lotus: 0,
  humayun: 0,
  "jama-masjid": Math.PI / 2,
}

const loader = new GLTFLoader()

function polishMesh(o: Object3D) {
  const mesh = o as Mesh
  if (!mesh.isMesh) return
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
  for (const raw of mats) {
    const mat = raw as MeshStandardMaterial
    if (!mat.isMeshStandardMaterial) continue
    mat.envMapIntensity = 0.85
    if (mat.map) mat.map.anisotropy = 8
    mat.needsUpdate = true
  }
  mesh.castShadow = true
  mesh.receiveShadow = true
}

export async function loadLandmarkGlb(id: string, url: string): Promise<Group> {
  const gltf = await loader.loadAsync(url)
  const model = gltf.scene
  model.rotation.y = LANDMARK_YAW[id] ?? 0
  model.updateMatrixWorld(true)

  const box = new Box3().setFromObject(model)
  const size = box.getSize(new Vector3())
  const targetH = heightUnits(LANDMARK_HEIGHT_M[id] ?? 40)
  const s = targetH / Math.max(size.y, 0.001)
  model.scale.setScalar(s)
  model.updateMatrixWorld(true)

  const fitted = new Box3().setFromObject(model)
  const center = fitted.getCenter(new Vector3())
  model.position.x -= center.x
  model.position.z -= center.z
  model.position.y -= fitted.min.y
  model.updateMatrixWorld(true)

  const seated = new Box3().setFromObject(model)
  const dim = seated.getSize(new Vector3())

  model.traverse(polishMesh)

  const lod = new LOD()
  lod.name = `lod-${id}`
  lod.addLevel(model, 0)
  const proxy = new Mesh(
    new BoxGeometry(Math.max(dim.x, 1.2), Math.max(dim.y, 1.2), Math.max(dim.z, 1.2)),
    new MeshStandardMaterial({
      color: new Color(0xb08a6a),
      roughness: 0.78,
      metalness: 0.04,
    }),
  )
  proxy.position.y = dim.y * 0.5
  proxy.castShadow = false
  proxy.receiveShadow = true
  proxy.userData.placeId = id
  lod.addLevel(proxy, 160)

  const root = new Group()
  root.name = `generated-${id}`
  root.add(lod)
  const place = PLACE_BY_ID[id]
  if (place) {
    const p = project(place.lat, place.lng)
    root.position.set(p.x, 0, p.z)
  }
  root.userData.placeId = id
  root.userData.generated = true
  root.traverse((o: Object3D) => {
    o.userData.placeId = id
  })
  return root
}
