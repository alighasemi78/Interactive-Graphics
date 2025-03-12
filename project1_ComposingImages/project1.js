// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.
function composite(bgImg, fgImg, fgOpac, fgPos) {
  let bgData = bgImg.data;
  let fgData = fgImg.data;
  let bgWidth = bgImg.width;
  let bgHeight = bgImg.height;
  let fgWidth = fgImg.width;
  let fgHeight = fgImg.height;

  let fgX = fgPos.x;
  let fgY = fgPos.y;

  // Loop through each pixel in the foreground image
  for (let y = 0; y < fgHeight; y++) {
    for (let x = 0; x < fgWidth; x++) {
      // Calculate the index of the current pixel in the foreground image
      let fgIndex = (y * fgWidth + x) * 4;

      // Compute the corresponding background coordinates
      let bgX = fgX + x;
      let bgY = fgY + y;

      // Ignore pixels that are out of the background image bounds
      if (bgX < 0 || bgX >= bgWidth || bgY < 0 || bgY >= bgHeight) {
        continue;
      }

      // Calculate the index of the corresponding pixel in the background image
      let bgIndex = (bgY * bgWidth + bgX) * 4;

      // Extract RGB and alpha values from the foreground image
      let fgR = fgData[fgIndex];
      let fgG = fgData[fgIndex + 1];
      let fgB = fgData[fgIndex + 2];
      let fgA = (fgData[fgIndex + 3] / 255) * fgOpac; // Scale alpha by given opacity

      // Extract RGB and alpha values from the background image
      let bgR = bgData[bgIndex];
      let bgG = bgData[bgIndex + 1];
      let bgB = bgData[bgIndex + 2];
      let bgA = bgData[bgIndex + 3] / 255;

      // Compute the final alpha value after blending
      let outA = fgA + bgA * (1 - fgA);

      // If there is any opacity, blend the colors
      if (outA > 0) {
        bgData[bgIndex] = (fgR * fgA + bgR * bgA * (1 - fgA)) / outA; // Blend red channel
        bgData[bgIndex + 1] = (fgG * fgA + bgG * bgA * (1 - fgA)) / outA; // Blend green channel
        bgData[bgIndex + 2] = (fgB * fgA + bgB * bgA * (1 - fgA)) / outA; // Blend blue channel
        bgData[bgIndex + 3] = outA * 255; // Convert final alpha back to 0-255 range
      }
    }
  }
}
