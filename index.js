const Jimp = require("jimp");
const program_mode = true;

const palette = [
	0xbe0039, 0xff4500, 0xffa800, 0xffd635, 0x00a368, 0x00cc78, 0x7eed56,
	0x00756f, 0x009eaa, 0x2450a4, 0x3690ea, 0x51e9f4, 0x493ac1, 0x6a5cff,
	0x811e9f, 0xb44ac0, 0xff3881, 0xff99aa, 0x6d482f, 0x9c6926, 0x000000,
	0x898d90, 0xd4d7d9, 0xffffff
].map((c) => c * 256 + 255);

function overlayify(images) {
	return new Promise(async (resolve, reject) => {
		// create 2000x2000 canvas
		let canvas = new Jimp(2000, 2000, 0x00000000);
		for (let img of images) {
			canvas.composite(await Jimp.read(img.image_path), img.x, img.y);
		}
		canvas.resize(6000, 6000, Jimp.RESIZE_NEAREST_NEIGHBOR);
		// for every pixel
		for (let px = 0; px < canvas.bitmap.width; px++) {
			for (let py = 0; py < canvas.bitmap.height; py++) {
				let col = canvas.getPixelColor(px, py);
				if (py % 3 !== 1 || px % 3 !== 1) {
					canvas.setPixelColor(col - (col % 0x100), px, py);
				} else if (col !== 0x00000000) {
					// replace with closest color in the palette
					canvas.setPixelColor(
						palette.sort((a, b) => Math.abs(a - col) - Math.abs(b - col))[0],
						px,
						py
					);
				}
			}
		}
		resolve(canvas);
	});
}

if (program_mode) {
	let args = process.argv.slice(2);
	// split images in order image_path, x, y
	let images = [];
	for (let i = 0; i < args.length; i += 3) {
		images.push({
			image_path: args[i],
			x: parseInt(args[i + 1]),
			y: parseInt(args[i + 2])
		});
	}
	overlayify(images).then((ov) => ov.write("overlay.png"));
}
