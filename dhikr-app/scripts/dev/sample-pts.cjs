const sharp = require("sharp");
const path = require("path");

(async () => {
  const { data, info } = await sharp(path.join(process.env.TEMP, "opencode", "screen5.png")).raw().toBuffer({ resolveWithObject: true });
  const pts = [[600,700],[400,730],[600,1170],[900,1150],[600,200],[600,500],[600,2600],[300,1500],[640,640],[640,1500],[100,50],[640,2400],[600,100],[640,1190]];
  for (const [x, y] of pts) {
    const i = (y * info.width + x) * 4;
    console.log(x, y, `rgb(${data[i]},${data[i+1]},${data[i+2]})`);
  }
})();