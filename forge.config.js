const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");

module.exports = {
  packagerConfig: {
    asar: true,
    icon: "./assets/icon.icns", // Will be created later
    name: "Curio",
    executableName: "Curio",
    appCopyright: "Copyright © 2024 Curio Team",
    appCategoryType: "public.app-category.productivity",
    protocols: [
      {
        name: "Curio Protocol",
        schemes: ["curio"],
      },
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "Curio",
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {},
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
    {
      name: "@electron-forge/plugin-fuses",
      config: {
        version: 1,
        fuses: {
          onlyLoadAppFromAsar: true,
        },
      },
    },
  ],
};
