/**
 * The file enables `@/store/index.js` to import all vuex modules
 * in a one-shot manner. There should not be any reason to edit this file.
 */

const files = import.meta.glob('./*.js', { eager: true });
const modules = {};

for (const path in files) {
  const key = path.replace(/(\.\/|\.js)/g, '');
  if (key === 'index') continue;
  modules[key] = files[path].default;
}

export default modules;
