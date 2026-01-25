// src/styles/uiStyles.js

// Shared tokens for color theme
export const TOKENS = {
  panelBg: "#6c6c6c22",
  panelHeaderBg: "#6c6c6c33",
  popupBg: "#1f1f1fcc",
  borderSoft: "#ffffff22",
  borderSofter: "#ffffff33",
};

// Generic card container used by LiveReadout / MinMaxReadout
export const cardStyle = {
  padding: "1rem",
  borderRadius: "8px",
  fontFamily: "sans-serif",
  backgroundColor: TOKENS.panelHeaderBg,
  width: "max-content",
  maxWidth: "100%",
  margin: "0",
};

// Chart panel containers
export const chartPanelContainerStyle = {
  padding: "0.75rem",
  borderRadius: "10px",
  backgroundColor: TOKENS.panelBg,
};

export const chartPanelControlsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  flexWrap: "wrap",
  padding: "0.75rem",
  borderRadius: "8px",
  backgroundColor: TOKENS.panelHeaderBg,
  marginBottom: "1rem",
};

// Shared small UI controls
export const iconButtonStyle = {
  width: "28px",
  height: "24px",
  borderRadius: "6px",
  border: `1px solid ${TOKENS.borderSofter}`,
  backgroundColor: "#00000022",
  cursor: "pointer",
  padding: 0,
  boxShadow: "inset 0 1px 0 #ffffff22, 0 1px 2px #00000055",
  transition: "transform 80ms ease, filter 120ms ease",
};

// Needs to be a function because it depends on "disabled"
export const infoButtonStyle = (disabled) => ({
  ...iconButtonStyle,
  width: "24px",
  height: "24px",
  borderRadius: "999px",
  fontWeight: 700,
  fontSize: "0.85rem",
  lineHeight: "1",
  opacity: disabled ? 0.35 : 0.9,
  cursor: disabled ? "not-allowed" : "pointer",
});

export const popupStyle = {
  position: "absolute",
  zIndex: 80,
  top: "100%",
  left: "0",
  marginTop: "0.5rem",
  padding: "0.6rem 0.7rem",
  borderRadius: "10px",
  backgroundColor: TOKENS.popupBg,
  border: `1px solid ${TOKENS.borderSoft}`,
  backdropFilter: "blur(6px)",
  boxShadow: "0 8px 24px #00000055",
  minWidth: "240px",
};

export const colorInputStyle = {
  ...iconButtonStyle,
  backgroundColor: "transparent",
  border: "1px solid #ffffff66",
  boxShadow: `
    inset 0 0 0 2px #00000055,
    inset 0 1px 0 #ffffff22,
    inset 0 -1px 0 #00000044,
    0 1px 2px #00000066
  `,
  borderRadius: "6px",
  overflow: "hidden",
  appearance: "none",
  WebkitAppearance: "none",
};

export const chartPanelStyles = {
  iconButtonStyle,
  infoButtonStyle,
  popupStyle,
  colorInputStyle,
  chartPanelContainerStyle,
  chartPanelControlsStyle,
};