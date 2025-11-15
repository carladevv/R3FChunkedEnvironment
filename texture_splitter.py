import bpy
import os

# ==========================
# USER SETTINGS
# ==========================

# Name of the image in bpy.data.images (Blender's internal image name)
IMAGE_NAME = "Ground048_4K-JPG_AmbientOcclusion.jpg"  # <- change to match your image datablock name

# How many tiles per row/column (4x4 for 4k -> 1k tiles)
TILES_PER_AXIS = 4

# Top-level folder (under the .blend directory)
PARENT_FOLDER_NAME = "Ground48"  # <- you choose this

# Folder name inside each tile folder where LODs are stored
LOD_VARIANT_FOLDER_NAME = "AO"  # <- same for all tiles

# Output image format
OUTPUT_FORMAT = "JPEG"  # "PNG" or "JPEG" etc.

# LOD sizes (in pixels)
# LOD_02 uses the tile's native resolution (e.g. 1024x1024)
LOD_01_SIZE = 512
LOD_00_SIZE = 64  # interprets your "64kb" as a 64x64 tiny LOD

# ==========================


def get_output_extension(file_format: str) -> str:
    """Map Blender's image format name to a file extension."""
    fmt = file_format.upper()
    if fmt == "JPEG":
        return ".jpg"
    else:
        return "." + fmt.lower()


def ensure_dir(path: str):
    """Create directory if it does not exist."""
    os.makedirs(path, exist_ok=True)


def split_image_to_lods(image: bpy.types.Image):
    # Get the directory where the .blend file is saved
    root_dir = os.path.normpath(bpy.path.abspath("//"))
    if not root_dir:
        raise ValueError("Blend file is not saved. Please save your .blend file first.")

    print(f"Blend root directory: {root_dir}")

    # Image dimensions
    width, height = image.size
    src_channels = image.channels

    if width != height:
        raise ValueError(f"Image must be square, found {width}x{height}")

    if width % TILES_PER_AXIS != 0 or height % TILES_PER_AXIS != 0:
        raise ValueError(
            f"Image size {width}x{height} is not divisible by {TILES_PER_AXIS}."
        )

    tile_w = width // TILES_PER_AXIS
    tile_h = height // TILES_PER_AXIS

    print(f"Image '{image.name}' size: {width}x{height}")
    print(f"Tile size: {tile_w}x{tile_h}, tiles per axis: {TILES_PER_AXIS}")

    # Prepare paths
    parent_dir = os.path.join(root_dir, PARENT_FOLDER_NAME)
    ensure_dir(parent_dir)

    print(f"Parent folder: {parent_dir}")

    # Prepare pixel data from source
    src_pixels = list(image.pixels)  # [r, g, b, a, r, g, b, a, ...]

    dst_channels = 4  # we'll always create RGBA tiles

    total_tiles = TILES_PER_AXIS * TILES_PER_AXIS

    # Blender pixels are row-major from bottom to top
    # We want tile indices in Western reading order from the TOP:
    #
    # 00 01 02 03
    # 04 05 06 07
    # 08 09 10 11
    # 12 13 14 15
    #
    for tile_index in range(total_tiles):
        tile_y_index = tile_index // TILES_PER_AXIS  # 0 = top row, 1 = second row, ...
        tile_x_index = tile_index % TILES_PER_AXIS   # 0 = leftmost, ...

        # Convert "top-based" row to Blender's bottom-based coordinates
        base_x = tile_x_index * tile_w
        base_y = (TILES_PER_AXIS - 1 - tile_y_index) * tile_h

        # Folder for this tile: parent_01, parent_02, ...
        tile_folder_name = f"{PARENT_FOLDER_NAME}_{tile_index + 1:02d}"
        tile_dir = os.path.join(parent_dir, tile_folder_name)
        ensure_dir(tile_dir)

        # Inner LOD variant folder (same for all tiles)
        lod_variant_dir = os.path.join(tile_dir, LOD_VARIANT_FOLDER_NAME)
        ensure_dir(lod_variant_dir)

        # Extension based on OUTPUT_FORMAT
        extension = get_output_extension(OUTPUT_FORMAT)

        # Create a new image for this tile at full tile resolution (LOD_02 base)
        tile_name = f"{image.name}_tile_{tile_index:02d}"
        tile_image = bpy.data.images.new(
            name=tile_name,
            width=tile_w,
            height=tile_h,
            alpha=True
        )

        tile_pixels = [0.0] * (tile_w * tile_h * dst_channels)

        # Copy pixels from source to tile
        for local_y in range(tile_h):
            for local_x in range(tile_w):
                global_x = base_x + local_x
                global_y = base_y + local_y

                src_idx = (global_y * width + global_x) * src_channels
                dst_idx = (local_y * tile_w + local_x) * dst_channels

                # Copy up to src_channels, fill the rest (like alpha) as needed
                for c in range(dst_channels):
                    if c < src_channels:
                        tile_pixels[dst_idx + c] = src_pixels[src_idx + c]
                    else:
                        tile_pixels[dst_idx + c] = 1.0  # alpha = 1

        tile_image.pixels = tile_pixels

        # --- Save LOD_02 (original tile size) ---
        lod2_path = os.path.join(lod_variant_dir, "LOD_02" + extension)
        tile_image.file_format = OUTPUT_FORMAT
        tile_image.filepath_raw = lod2_path
        tile_image.save()
        print(f"Tile {tile_index:02d} LOD_02 saved: {lod2_path}")

        # --- Save LOD_01 (scaled down to LOD_01_SIZE x LOD_01_SIZE) ---
        tile_image.scale(LOD_01_SIZE, LOD_01_SIZE)
        lod1_path = os.path.join(lod_variant_dir, "LOD_01" + extension)
        tile_image.filepath_raw = lod1_path
        tile_image.save()
        print(f"Tile {tile_index:02d} LOD_01 saved: {lod1_path}")

        # --- Save LOD_00 (scaled down to LOD_00_SIZE x LOD_00_SIZE) ---
        tile_image.scale(LOD_00_SIZE, LOD_00_SIZE)
        lod0_path = os.path.join(lod_variant_dir, "LOD_00" + extension)
        tile_image.filepath_raw = lod0_path
        tile_image.save()
        print(f"Tile {tile_index:02d} LOD_00 saved: {lod0_path}")

        # Clean up tile image from Blender to avoid clutter
        tile_image.user_clear()
        bpy.data.images.remove(tile_image)

    print("All tiles and LODs generated successfully.")


def main():
    image = bpy.data.images.get(IMAGE_NAME)
    if image is None:
        raise ValueError(f"Image '{IMAGE_NAME}' not found in bpy.data.images")
    split_image_to_lods(image)


if __name__ == "__main__":
    main()
