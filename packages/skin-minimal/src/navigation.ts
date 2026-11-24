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

/** minimal's tab bar: a hairline under the bar and a 2 px ink indicator as wide as the tab. */
export const minimalTabs: Renderer<TabsState, TabsSlots, TabsStyle> = {
  ...tabsBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      defaultAppearance: "solid",
      kind: "underline",
      height: field("tabs", "height", "48px"),
      heightWithIcon: field("tabs", "height-with-icon", "64px"),
      indicatorHeight: field("tabs", "indicator-height", "2px"),
      indicatorWidth: "tab",
      minTabWidth: field("tabs", "min-tab-width", "90px"),
      showDivider: true,
      iconSize: field("tabs", "icon-size", "20px"),
      iconGap: field("tabs", "icon-gap", theme.spacing.xs),
      tabPadding: field("tabs", "tab-padding", theme.spacing.l),
      shape: theme.shapes.medium,
      labelStyle: theme.typography.titleSmall,
      solid: {
        container: c.surface,
        selected: c.onSurface,
        unselected: c.onSurfaceVariant,
        indicator: c.primary,
        thumb: c.surfaceContainerHigh,
        divider: c.outlineVariant,
      },
      ghost: {
        container: c.surface,
        selected: c.onSurface,
        unselected: c.onSurfaceVariant,
        indicator: c.primary,
        thumb: c.surfaceContainerHigh,
        divider: "transparent",
      },
    };
  },
};

/** minimal's tab. */
export const minimalTab: Renderer<TabState, TabSlots, TabsStyle> = {
  ...tabBase,
  defaults: (theme) => minimalTabs.defaults(theme),
};

/** minimal's navigation item: no indicator, the selected one turns ink; a selected drawer row is a soft fill. */
export const minimalNavItem: Renderer<NavItemState, NavItemSlots, NavItemStyle> = {
  ...navItemBase,
  defaults(theme) {
    const c = theme.colors;
    const look = (chrome: string, over: Partial<NavItemLook>): NavItemLook => ({
      indicator: "none",
      indicatorWidth: field(chrome, "indicator-width", "64px"),
      indicatorHeight: field(chrome, "indicator-height", "32px"),
      indicatorShape: field(chrome, "indicator-shape", theme.shapes.full),
      itemHeight: "56px",
      iconSize: field(chrome, "icon-size", "24px"),
      iconGap: theme.spacing.xxs,
      labelStyle: theme.typography.labelMedium,
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
      rail: look("navigation-rail", { itemHeight: "56px" }),
      drawer: look("navigation-drawer", {
        indicator: "fill",
        itemHeight: field("navigation-drawer", "item-height", "48px"),
        indicatorShape: field("navigation-drawer", "item-shape", theme.shapes.medium),
        iconGap: theme.spacing.l,
        labelStyle: theme.typography.labelLarge,
        direction: "row",
        indicatorColor: c.surfaceContainerHigh,
        selectedIcon: c.onSurface,
        selectedLabel: c.onSurface,
        icon: c.onSurfaceVariant,
        label: c.onSurface,
      }),
    };
  },
};

/** minimal's navigation bar: 56 tall, a hairline above it. */
export const minimalNavigationBar: Renderer<
  NavigationBarState,
  NavigationBarSlots,
  NavigationBarStyle
> = {
  ...navigationBarBase,
  defaults(theme) {
    return {
      placement: "pinned",
      height: field("navigation-bar", "height", "56px"),
      floatingMargin: field("navigation-bar", "floating-margin", theme.spacing.l),
      floatingShape: field("navigation-bar", "floating-shape", theme.shapes.full),
      iconSize: field("navigation-bar", "icon-size", "24px"),
      indicatorWidth: field("navigation-bar", "indicator-width", "64px"),
      indicatorHeight: field("navigation-bar", "indicator-height", "32px"),
      indicatorShape: field("navigation-bar", "indicator-shape", theme.shapes.full),
      container: theme.colors.surface,
      divider: theme.colors.outlineVariant,
      hairline: "1px",
    };
  },
};

/** minimal's navigation rail: 72 wide, a hairline on the end edge. */
export const minimalNavigationRail: Renderer<
  NavigationRailState,
  NavigationRailSlots,
  NavigationRailStyle
> = {
  ...navigationRailBase,
  defaults(theme) {
    return {
      alignment: "top",
      width: field("navigation-rail", "width", "72px"),
      itemSpacing: field("navigation-rail", "item-spacing", theme.spacing.s),
      iconSize: field("navigation-rail", "icon-size", "24px"),
      indicatorWidth: field("navigation-rail", "indicator-width", "56px"),
      indicatorHeight: field("navigation-rail", "indicator-height", "32px"),
      container: theme.colors.surface,
      divider: theme.colors.outlineVariant,
      hairline: "1px",
    };
  },
};

/** minimal's navigation drawer: 280 wide, rows filled when selected. */
export const minimalNavigationDrawer: Renderer<
  NavigationDrawerState,
  NavigationDrawerSlots,
  NavigationDrawerStyle
> = {
  ...navigationDrawerBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      width: field("navigation-drawer", "width", "280px"),
      itemHeight: field("navigation-drawer", "item-height", "48px"),
      itemShape: field("navigation-drawer", "item-shape", theme.shapes.medium),
      modalShape: field("navigation-drawer", "modal-shape", theme.shapes.large),
      scrimAlpha: field("navigation-drawer", "scrim-alpha", "32%"),
      container: c.surface,
      modalContainer: c.surface,
      divider: c.outlineVariant,
      hairline: "1px",
    };
  },
};
