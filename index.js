const Jimp = require("jimp");
const program_mode = true;

const GRID_SIZE = 500
const PALETTE = [
	7143450, 12451897, 16729344, 16754688, 16766517, 16775352, 41832, 52344,
	8318294, 30063, 40618, 52416, 2379940, 3576042, 5368308, 4799169, 6970623,
	9745407, 8461983, 11815616, 14986239, 14553215, 16726145, 16751018, 7161903,
	10250534, 16757872, 0, 5329490, 9014672, 13948889, 16777215
].map((c) => c * 256 + 255);

// #rrggbbaa
const red = (x) => (x & 0xff000000) >>> 24;
const green = (x) => (x & 0x00ff0000) >>> 16;
const blue = (x) => (x & 0x0000ff00) >>> 8;
const alpha = (x) => x & 0x000000ff;
const rgba = (x) => [red(x), green(x), blue(x), alpha(x)];

function difference(c1, c2) {
	let diff = 0;
	for (let i = 0; i < c1.length; i++) diff += (c1[i] - c2[i]) * (c1[i] - c2[i]);
	return Math.sqrt(diff);
}

function overlayify(images) {
	console.log('Building overlay....')
	return new Promise(async (resolve, reject) => {
		// create 2000x2000 canvas
		let canvas = new Jimp(GRID_SIZE, GRID_SIZE, 0x00000000);
		for (let img of images) {
			canvas.composite(await Jimp.read(img.image_path), img.x, img.y);
		}
		canvas.resize(GRID_SIZE*3, GRID_SIZE*3, Jimp.RESIZE_NEAREST_NEIGHBOR);
		// for every pixel
		for (let px = 0; px < canvas.bitmap.width; px++) {
			for (let py = 0; py < canvas.bitmap.height; py++) {

				let col = canvas.getPixelColor(px, py);
				if (py % 3 !== 1 || px % 3 !== 1) {
					canvas.setPixelColor(col - (col % 0x100), px, py);
				} else if (col !== 0x00000000) {
					// replace with closest color in the PALETTE
					// check red green blue values
					canvas.setPixelColor(
						PALETTE.sort( (a, b) => difference( rgba(col), rgba(a) ) - difference( rgba(col), rgba(b) ) )[0],
						px,
						py
					);
				}
				// if(col != 0) {
				// 	console.log({x: px, y: py, color: col})

				// }

			}
		}
		resolve(canvas);
	});
}

if (program_mode) {
	let args = process.argv.slice(2);
	// split images in order image_path, x, y
	let images = [];
	if(args.length == 0) {
		const schema = require('./overlay.schema')
		schema.map(e => images.push({image_path: e.path, x: e.x, y: e.y}))
	} else {
		for (let i = 0; i < args.length; i += 3) {
			images.push({
				image_path: args[i],
				x: parseInt(args[i + 1]),
				y: parseInt(args[i + 2])
			});
		}
	}

	overlayify(images).then((ov) => ov.write("overlay.png"));
}
