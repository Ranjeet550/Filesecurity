// Theme configuration based on Slash Admin color scheme
const themeConfig = {
  token: {
    colorPrimary: '#00BF96', // Teal/green primary color
    colorSuccess: '#00BF96',
    colorInfo: '#1890ff',
    colorWarning: '#FF9F43',
    colorError: '#FF5C75',
    colorTextBase: '#333333',
    colorBgBase: '#f5f5f5',
    borderRadius: 6,
    fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  components: {
    Layout: {
      siderBg: '#ffffff',
      headerBg: '#ffffff',
    },
    Menu: {
      darkItemBg: '#1a2141',
      darkItemColor: 'rgba(255, 255, 255, 0.65)',
      darkItemHoverBg: '#273053',
      darkItemSelectedBg: '#00BF96',
      darkItemSelectedColor: '#ffffff',
    },
    Card: {
      colorBorderSecondary: '#e8e8e8',
    },
    Button: {
      borderRadius: 6,
    },
    Input: {
      borderRadius: 6,
    },
  },
};

export default themeConfig;
