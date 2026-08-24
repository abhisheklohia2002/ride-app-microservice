import { App as AntApp, ConfigProvider, theme } from "antd";
import { useThemeMode } from "./context/ThemeProvider/ThemeProvider";
import { RouterProvider } from "react-router-dom";


import { router } from "./app/router";

function App() {
  const { isDarkMode } = useThemeMode();

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode
          ? theme.darkAlgorithm
          : theme.defaultAlgorithm,

        token: {
          borderRadius: 12,

          ...(isDarkMode
            ? {
                colorPrimary: "#22C7B8",
                colorPrimaryHover: "#35D6C8",
                colorPrimaryActive: "#14B8A6",

                colorBgBase: "#0B1220",
                colorBgLayout: "#0B1220",
                colorBgContainer: "#111C2E",
                colorBgElevated: "#162238",

                colorBorder: "#253249",
                colorBorderSecondary: "#1E293B",

                colorTextBase: "#EAF0F7",
                colorText: "#EAF0F7",
                colorTextSecondary: "#A8B3C7",
                colorTextTertiary: "#7D8AA3",

                colorSuccess: "#34D399",
                colorWarning: "#F59E0B",
                colorError: "#F87171",

                colorFillSecondary: "#1B2940",
                colorBgTextActive: "#1B2940",
              }
            : {
                colorPrimary: "#109B9C",
                colorPrimaryHover: "#14B8A6",
                colorPrimaryActive: "#0F766E",

                colorBgBase: "#F4F7FB",
                colorBgLayout: "#F4F7FB",
                colorBgContainer: "#FFFFFF",
                colorBgElevated: "#FFFFFF",

                colorBorder: "#E2E8F0",
                colorBorderSecondary: "#EEF2F7",

                colorTextBase: "#111827",
                colorText: "#111827",
                colorTextSecondary: "#64748B",
                colorTextTertiary: "#94A3B8",

                colorSuccess: "#16A34A",
                colorWarning: "#F59E0B",
                colorError: "#DC2626",

                colorBgTextActive: "#E6FFFB",
              }),
        },

        components: {
          Layout: {
            headerBg: isDarkMode ? "#0F172A" : "#FFFFFF",
            siderBg: isDarkMode ? "#07111F" : "#FFFFFF",
            bodyBg: isDarkMode ? "#0B1220" : "#F4F7FB",
          },

          Menu: isDarkMode
            ? {
                darkItemBg: "#07111F",
                darkSubMenuItemBg: "#07111F",

                darkItemColor: "#A8B3C7",
                darkItemHoverColor: "#FFFFFF",
                darkItemHoverBg: "#111C2E",

                darkItemSelectedBg: "#22C7B8",
                darkItemSelectedColor: "#031B1A",

                darkGroupTitleColor: "#64748B",

                // Important for submenu title visibility
                itemColor: "#A8B3C7",
                itemHoverColor: "#FFFFFF",
                itemHoverBg: "#111C2E",

                itemSelectedBg: "#22C7B8",
                itemSelectedColor: "#031B1A",

                subMenuItemBg: "#07111F",
              }
            : {
                itemBg: "#FFFFFF",
                subMenuItemBg: "#FFFFFF",

                itemColor: "#334155",
                itemHoverColor: "#0F766E",
                itemHoverBg: "#F0FDFA",

                itemSelectedBg: "#E6FFFB",
                itemSelectedColor: "#0F766E",

                groupTitleColor: "#94A3B8",
              },

          Card: {
            colorBgContainer: isDarkMode
              ? "#111C2E"
              : "#FFFFFF",
          },

          Button: {
            primaryShadow: "none",
          },

          Table: {
            headerBg: isDarkMode ? "#1B2940" : "#F8FAFC",
            headerColor: isDarkMode ? "#EAF0F7" : "#111827",
            rowHoverBg: isDarkMode ? "#162238" : "#F8FAFC",

            borderColor: isDarkMode
              ? "#253249"
              : "#E2E8F0",

            colorBgContainer: isDarkMode
              ? "#111C2E"
              : "#FFFFFF",

            colorText: isDarkMode
              ? "#EAF0F7"
              : "#111827",

            colorTextHeading: isDarkMode
              ? "#EAF0F7"
              : "#111827",
          },

          Pagination: {
            itemActiveBg: isDarkMode
              ? "#111C2E"
              : "#E6FFFB",

            colorPrimary: isDarkMode
              ? "#22C7B8"
              : "#109B9C",

            colorPrimaryHover: isDarkMode
              ? "#35D6C8"
              : "#14B8A6",

            colorText: isDarkMode
              ? "#EAF0F7"
              : "#111827",

            colorTextDisabled: isDarkMode
              ? "#64748B"
              : "#94A3B8",

            colorBgContainer: isDarkMode
              ? "#111C2E"
              : "#FFFFFF",

            colorBorder: isDarkMode
              ? "#253249"
              : "#E2E8F0",
          },

          Form: {
            labelColor: isDarkMode
              ? "#CBD5E1"
              : "#334155",
          },

          Modal: {
            contentBg: isDarkMode
              ? "#111C2E"
              : "#FFFFFF",

            headerBg: isDarkMode
              ? "#111C2E"
              : "#FFFFFF",

            titleColor: isDarkMode
              ? "#EAF0F7"
              : "#111827",
          },

          Drawer: {
            colorBgElevated: isDarkMode
              ? "#111C2E"
              : "#FFFFFF",

            colorText: isDarkMode
              ? "#EAF0F7"
              : "#111827",
          },

          Input: {
            colorBgContainer: isDarkMode
              ? "#0F172A"
              : "#FFFFFF",

            colorBorder: isDarkMode
              ? "#253249"
              : "#E2E8F0",

            colorText: isDarkMode
              ? "#EAF0F7"
              : "#111827",

            colorTextPlaceholder: isDarkMode
              ? "#64748B"
              : "#94A3B8",
          },

          Select: {
            colorBgContainer: isDarkMode
              ? "#0F172A"
              : "#FFFFFF",

            colorBgElevated: isDarkMode
              ? "#111C2E"
              : "#FFFFFF",

            colorBorder: isDarkMode
              ? "#253249"
              : "#E2E8F0",

            colorText: isDarkMode
              ? "#EAF0F7"
              : "#111827",

            colorTextPlaceholder: isDarkMode
              ? "#64748B"
              : "#94A3B8",

            optionSelectedBg: isDarkMode
              ? "#1B2940"
              : "#E6FFFB",

            optionActiveBg: isDarkMode
              ? "#162238"
              : "#F0FDFA",
          },

          Upload: {
            colorText: isDarkMode
              ? "#EAF0F7"
              : "#111827",
          },

          Typography: {
            colorText: isDarkMode
              ? "#EAF0F7"
              : "#111827",

            colorTextHeading: isDarkMode
              ? "#EAF0F7"
              : "#111827",
          },
        },
      }}
    >
      <AntApp>
        <RouterProvider router={router} />
      </AntApp>
    </ConfigProvider>
  );
}

export default App;