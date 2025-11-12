// Override CRA's PostCSS to use Tailwind v4 plugin instead of legacy 'tailwindcss'
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      const rulesContainer = webpackConfig.module && webpackConfig.module.rules;
      if (!rulesContainer) return webpackConfig;

      const oneOfRule = rulesContainer.find((rule) => Array.isArray(rule.oneOf));
      if (!oneOfRule) return webpackConfig;

      oneOfRule.oneOf.forEach((rule) => {
        if (!Array.isArray(rule.use)) return;
        rule.use.forEach((use) => {
          if (
            use &&
            use.loader &&
            use.loader.includes('postcss-loader') &&
            use.options &&
            use.options.postcssOptions
          ) {
            const postcssOptions = use.options.postcssOptions;
            const tailwindPostcss = require('@tailwindcss/postcss');

            if (Array.isArray(postcssOptions.plugins)) {
              postcssOptions.plugins = postcssOptions.plugins.map((plugin) => {
                if (plugin === 'tailwindcss') {
                  return tailwindPostcss;
                }
                return plugin;
              });
              const hasTailwind = postcssOptions.plugins.some((p) => p === tailwindPostcss);
              if (!hasTailwind) {
                postcssOptions.plugins.unshift(tailwindPostcss);
              }
            } else if (typeof postcssOptions.plugins === 'function') {
              const original = postcssOptions.plugins;
              postcssOptions.plugins = (...args) => {
                const result = original(...args) || [];
                const mapped = result.map((plugin) =>
                  plugin === 'tailwindcss' ? tailwindPostcss : plugin
                );
                if (!mapped.some((p) => p === tailwindPostcss)) {
                  mapped.unshift(tailwindPostcss);
                }
                return mapped;
              };
            } else {
              postcssOptions.plugins = [tailwindPostcss];
            }
          }
        });
      });

      return webpackConfig;
    },
  },
};































