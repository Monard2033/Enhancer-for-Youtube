# Enhancer for YouTube

Enhancer for YouTube is a lightweight, powerful user script designed to enhance your YouTube experience with additional features and customization options. This script allows you to manipulate page elements, improve video playback, and tailor the YouTube interface to your preferences. It is compatible with [TamperMonkey](https://www.tampermonkey.net/) and includes settings inspired by the Enhancer for YouTube Chrome extension.

## Features

- **Page Element Manipulation**: Hide or modify YouTube interface elements like the sidebar, related videos, or comments for a cleaner viewing experience.
- **Custom Playback Options**: Adjust playback speed with precision, loop video segments, or toggle auto-play effortlessly.
- **Video Quality Control**: Set preferred video quality (e.g., 1080p, 4K) or enable auto-HD mode for consistent playback.
- **Ad Management**: Automatically skip or mute ads where allowed by YouTube's terms for uninterrupted viewing.
- **Custom Themes**: Apply custom styles to personalize the YouTube interface.
- **Keyboard Shortcuts**: Use enhanced shortcuts for quick control of video playback and interface features.

## Repository Contents

This repository contains three files:

1. **`Enhancer For Youtube.jsx`**:
   - The raw JavaScript code for page element manipulation.
   - Core script for enhancing YouTube's functionality.
   - Can be used as a standalone script or as a reference for developers.

2. **`Enhancer For Youtube.json`**:
   - A JSON file containing the full settings configuration for the Enhancer for YouTube Chrome extension.
   - Useful for users who want to replicate or customize settings from the Chrome Web Store version.

3. **`Youtube-Enhancer-TamperMonkey`**:
   - The TamperMonkey-compatible user script.
   - Includes metadata for easy installation via TamperMonkey and integrates the core functionality with YouTube.

## Installation

### Using TamperMonkey
1. **Install TamperMonkey**:
   - Download and install the [TamperMonkey](https://www.tampermonkey.net/) extension for your browser (supports Chrome, Firefox, Edge, etc.).
   - Follow the extension's setup instructions.

2. **Install the Script**:
   - Navigate to the [repository](https://github.com/Monard2033/enhancer-for-youtube).
   - Open the `Youtube-Enhancer-TamperMonkey` file.
   - Click the **Raw** button to view the script's raw code.
   - TamperMonkey will detect the script and prompt you to install it. Click **Install**.

3. **Verify Installation**:
   - Visit [YouTube](https://www.youtube.com).
   - The script will automatically apply enhancements (e.g., new controls, modified UI) when loading YouTube pages.

### Using the Raw Script
- The `Enhancer For Youtube.jsx` file is provided for developers or advanced users who want to manually integrate or modify the script.
- You can load it into a custom environment or use it as a base for further development.

### Using the Settings File
- The `Enhancer For Youtube.json` file contains the configuration used by the Enhancer for YouTube Chrome extension.
- Import it into compatible environments or use it to customize the script's behavior manually.

## Usage

- The TamperMonkey script (`Youtube-Enhancer-TamperMonkey`) runs automatically on YouTube pages (`https://www.youtube.com/*`).
- Access the script's settings through a configuration panel added to the YouTube interface (if implemented) or by editing the `settings.json` file for custom setups.
- Customize features like video quality, playback speed, or UI elements to suit your preferences.
- Check the script's documentation within the code or the JSON file for specific shortcut keys and configuration options.

## Compatibility

- **Browsers**: Chrome, Firefox, Microsoft Edge, and other browsers supporting TamperMonkey.
- **YouTube**: Compatible with all YouTube pages, including videos, playlists, and channels.
- **TamperMonkey**: Requires TamperMonkey or a compatible user script manager for the `.user.js` file.
- **Chrome Extension Settings**: The `settings.json` file aligns with the Enhancer for YouTube Chrome extension's configuration format.

## Issues and Support

If you encounter issues or have suggestions:
- Open an issue on the [Issues](https://github.com/Monard2033/enhancer-for-youtube/issues) page with a detailed description, including:
  - Steps to reproduce the issue.
  - Your browser and TamperMonkey versions.
  - Screenshots or error messages, if applicable.

## License

This project is licensed under the [MIT License](LICENSE). You are free to use, modify, and distribute the script according to the license terms.

## Acknowledgments

- Built with inspiration from the Enhancer for YouTube Chrome extension.
- Thanks to the TamperMonkey team for their robust user script platform.
- Dedicated to YouTube users seeking a more tailored and enhanced viewing experience.

---

**Enhance your YouTube experience with YouTube Enhancer!**

For questions or feedback, file an issue on the [GitHub repository](https://github.com/yourusername/enhancer-for-youtube/issues) or contact [your contact info, if applicable].
