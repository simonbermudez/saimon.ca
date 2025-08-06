# Placeholder GPU Model

This file represents a placeholder for the GPU 3D model (gpu.glb).

## Expected Model Specifications

- **Format:** GLB (binary GLTF)
- **File Size:** < 5MB for web optimization
- **Geometry:** Tesla P40-style GPU card
- **Features:**
  - Main PCB body
  - Cooling fans (2x)
  - Heat sinks
  - Power connectors
  - Display outputs

## Model Requirements

- **Vertices:** < 10,000 for performance
- **Materials:** PBR materials with metallic/roughness workflow
- **Textures:** 1024x1024 maximum resolution
- **Animations:** Optional fan rotation animations

## Creating the Model

You can create this model using:
- **Blender** (free, open-source)
- **3ds Max** or **Maya** (commercial)
- **Online tools** like Clara.io

Export settings:
- Format: GLB 2.0
- Include materials and textures
- Optimize for web delivery

## Alternative

If you don't have a 3D model, the application will use procedural geometry to represent GPU cards using Three.js primitives.
