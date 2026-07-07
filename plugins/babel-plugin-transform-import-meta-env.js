// Transforms import.meta.env.X to process.env.X for web compatibility
// Metro web bundles are loaded as regular scripts, not ES modules

module.exports = function () {
  return {
    name: 'transform-import-meta-env',
    visitor: {
      MemberExpression(path) {
        if (
          path.node.object.type === 'MetaProperty' &&
          path.node.object.meta.name === 'import' &&
          path.node.object.property.name === 'meta'
        ) {
          // Replace import.meta.env with process.env
          // Replace import.meta.url with a require-based alternative
          if (path.node.property.name === 'env') {
            path.replaceWithSourceString('process.env');
          } else if (path.node.property.name === 'url') {
            // On web, import.meta.url is not available in regular scripts
            path.replaceWithSourceString('(typeof document !== "undefined" ? document.currentScript?.src : "")');
          }
        }
      },
    },
  };
};
