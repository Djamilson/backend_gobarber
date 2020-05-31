module.exports = nameFile => {
  return nameFile
    .replace('uploads/', '')
    .replace('-original', '')
    .trim();
};
