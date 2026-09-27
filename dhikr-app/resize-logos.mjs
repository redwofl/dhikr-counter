import('sharp').then(async({default:sharp})=>{
  const fs=require('fs');
  const R='android/app/src/main/res/';
  const densities=['mipmap-hdpi','mipmap-xhdpi','mipmap-xxhdpi','mipmap-xxxhdpi'];
  const sizes={hdpi:72, xhdpi:96, xxhdpi:144, xxxhdpi:192};
  const IMG='E:/ChatGPT Image Sep 28, 2026, 02_02_41 AM.png';
  
  for(const d of densities){
    const S=sizes[d];
    const fg=await sharp(IMG).resize(S,S).png().toBuffer();
    fs.writeFileSync(R+d+'/ic_launcher_foreground.png', fg);
    console.log('  '+d.padEnd(12)+S+'x'+S+' foreground written');
  }
  console.log('  mipmap-mdpi left as 1254x1254 source');
});