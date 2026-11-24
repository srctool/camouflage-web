import {
  navItemBase,
  navigationBarBase,
  navigationDrawerBase,
  navigationRailBase,
  tabBase,
  tabsBase,
} from "@srctool/camouflage-core";
import type {
  NavItemLook,
  NavItemSlots,
  NavItemState,
  NavItemStyle,
  NavigationBarSlots,
  NavigationBarState,
  NavigationBarStyle,
  NavigationDrawerSlots,
  NavigationDrawerState,
  NavigationDrawerStyle,
  NavigationRailSlots,
  NavigationRailState,
  NavigationRailStyle,
  Renderer,
  TabSlots,
  TabState,
  TabsSlots,
  TabsState,
  TabsStyle,
} from "@srctool/camouflage-core";

const field = (component: string, name: string, fallback: string): string =>
  `var(--camo-${component}-${name}, ${fallback})`;

/** cupertino's tab bar: a segmented control with a sliding pill; scrolling bars fall back to underlined tabs. */
export const cupertinoTabs: Renderer<TabsState, TabsSlots, TabsStyle> = {
  ...tabsBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      defaultAppearance: "solid",
      // A segmented control; a bar that scrolls falls back to the underline.
      kind: "segmented",
      height: field("tabs", "height", "32px"),
      heightWithIcon: field("tabs", "height-with-icon", "56px"),
      indicatorHeight: field("tabs", "indicator-height", "2px"),
      indicatorWidth: "content",
      minTabWidth: field("tabs", "min-tab-width", "90px"),
      showDivider: true,
      iconSize: field("tabs", "icon-size", "18px"),
      iconGap: field("tabs", "icon-gap", theme.spacing.xs),
      tabPadding: field("tabs", "tab-padding", theme.spacing.m),
      shape: theme.shapes.small,
      labelStyle: theme.typography.labelLarge,
      solid: {
        container: c.surfaceContainerHigh,
        selected: c.onSurface,
        unselected: c.onSurfaceVariant,
        indicator: c.primary,
        thumb: c.surface,
        divider: c.outlineVariant,
      },
      ghost: {
        container: c.surfaceContainerHigh,
        selected: c.onSurface,
        unselected: c.onSurfaceVariant,
        indicator: c.primary,
        thumb: c.surface,
        divider: "transparent",
      },
    };
  },
};

/** cupertino's tab. */
export const cupertinoTab: Renderer<TabState, TabSlots, TabsStyle> = {
  ...tabBase,
  defaults: (theme) => cupertinoTabs.defaults(theme),
};

/** cupertino's navigation item: the accent tints the selected one, labels always shown (iOS's tab bar). */
export const cupertinoNavItem: Renderer<NavItemState, NavItemSlots, NavItemStyle> = {
  ...navItemBase,
  defaults(theme) {
    const c = theme.colors;
    const look = (chrome: string, over: Partial<NavItemLook>): NavItemLook => ({
      indicator: "none",
      indicatorWidth: field(chrome, "indicator-width", "64px"),
      indicatorHeight: field(chrome, "indicator-height", "32px"),
      indicatorShape: field(chrome, "indicator-shape", theme.shapes.full),
      itemHeight: "49px",
      iconSize: field(chrome, "icon-size", "26px"),
      iconGap: theme.spacing.xxs,
      labelStyle: theme.typography.labelSmall,
      direction: "column",
      showLabels: "always",
      indicatorColor: "transparent",
      selectedIcon: c.primary,
      selectedLabel: c.primary,
      icon: c.onSurfaceVariant,
      label: c.onSurfaceVariant,
      ...over,
    });
    return {
      bar: look("navigation-bar", {}),
      rail: look("navigation-rail", { itemHeight: "60px" }),
      drawer: look("navigation-drawer", {
        indicator: "fill",
        itemHeight: field("navigation-drawer", "item-height", "44px"),
        indicatorShape: field("navigation-drawer", "item-shape", theme.shapes.medium),
        iconSize: "22px",
        iconGap: theme.spacing.m,
        labelStyle: theme.typography.bodyLarge,
        direction: "row",
        indicatorColor: c.primaryContainer,
        selectedIcon: c.onPrimaryContainer,
        selectedLabel: c.onPrimaryContainer,
        icon: c.primary,
        label: c.onSurface,
      }),
    };
  },
};

/** cupertino's navigation bar: iOS's 49 pt tab bar with a hairline above it. */
export const cupertinoNavigationBar: Renderer<
  NavigationBarState,
  NavigationBarSlots,
  NavigationBarStyle
> = {
  ...navigationBarBase,
  defaults(theme) {
    return {
      placement: "pinned",
      height: field("navigation-bar", "height", "49px"),
      floatingMargin: field("navigation-bar", "floating-margin", theme.spacing.l),
      floatingShape: field("navigation-bar", "floating-shape", theme.shapes.full),
      iconSize: field("navigation-bar", "icon-size", "26px"),
      indicatorWidth: field("navigation-bar", "indicator-width", "64px"),
      indicatorHeight: field("navigation-bar", "indicator-height", "32px"),
      indicatorShape: field("navigation-bar", "indicator-shape", theme.shapes.full),
      container: theme.colors.surfaceContainerLow,
      divider: theme.colors.outlineVariant,
      hairline: "1px",
    };
  },
};

/** cupertino's navigation rail: 80 wide. */
export const cupertinoNavigationRail: Renderer<
  NavigationRailState,
  NavigationRailSlots,
  NavigationRailStyle
> = {
  ...navigationRailBase,
  defaults(theme) {
    return {
      alignment: "top",
      width: field("navigation-rail", "width", "80px"),
      itemSpacing: field("navigation-rail", "item-spacing", theme.spacing.s),
      iconSize: field("navigation-rail", "icon-size", "26px"),
      indicatorWidth: field("navigation-rail", "indicator-width", "56px"),
      indicatorHeight: field("navigation-rail", "indicator-height", "32px"),
      container: theme.colors.surfaceContainerLow,
      divider: theme.colors.outlineVariant,
      hairline: "1px",
    };
  },
};

/** cupertino's navigation drawer: iOS's sidebar, 320 wide, tinted rows. */
export const cupertinoNavigationDrawer: Renderer<
  NavigationDrawerState,
  NavigationDrawerSlots,
  NavigationDrawerStyle
> = {
  ...navigationDrawerBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      width: field("navigation-drawer", "width", "320px"),
      itemHeight: field("navigation-drawer", "item-height", "44px"),
      itemShape: field("navigation-drawer", "item-shape", theme.shapes.medium),
      modalShape: field("navigation-drawer", "modal-shape", theme.shapes.extraLarge),
      scrimAlpha: field("navigation-drawer", "scrim-alpha", "32%"),
      container: c.surfaceContainerLow,
      modalContainer: c.surfaceContainerLow,
      divider: c.outlineVariant,
      hairline: "1px",
    };
  },
};
