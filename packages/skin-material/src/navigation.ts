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

/** Material's primary tabs: a 3 px indicator as wide as the content. */
export const materialTabs: Renderer<TabsState, TabsSlots, TabsStyle> = {
  ...tabsBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      defaultAppearance: "solid",
      kind: "underline",
      height: field("tabs", "height", "48px"),
      heightWithIcon: field("tabs", "height-with-icon", "64px"),
      indicatorHeight: field("tabs", "indicator-height", "3px"),
      indicatorWidth: "content",
      minTabWidth: field("tabs", "min-tab-width", "90px"),
      showDivider: true,
      iconSize: field("tabs", "icon-size", "20px"),
      iconGap: field("tabs", "icon-gap", theme.spacing.xs),
      tabPadding: field("tabs", "tab-padding", theme.spacing.l),
      shape: theme.shapes.medium,
      labelStyle: theme.typography.titleSmall,
      solid: {
        container: c.surface,
        selected: c.primary,
        unselected: c.onSurfaceVariant,
        indicator: c.primary,
        thumb: c.secondaryContainer,
        divider: c.outlineVariant,
      },
      ghost: {
        container: c.surface,
        selected: c.primary,
        unselected: c.onSurfaceVariant,
        indicator: c.primary,
        thumb: c.secondaryContainer,
        divider: "transparent",
      },
    };
  },
};

/** Material's tab. */
export const materialTab: Renderer<TabState, TabSlots, TabsStyle> = {
  ...tabBase,
  defaults: (theme) => materialTabs.defaults(theme),
};

/** Material's navigation item: a pill indicator behind the selected icon. */
export const materialNavItem: Renderer<NavItemState, NavItemSlots, NavItemStyle> = {
  ...navItemBase,
  defaults(theme) {
    const c = theme.colors;
    const look = (chrome: string, over: Partial<NavItemLook>): NavItemLook => ({
      indicator: "pill",
      indicatorWidth: field(chrome, "indicator-width", "64px"),
      indicatorHeight: field(chrome, "indicator-height", "32px"),
      indicatorShape: field(chrome, "indicator-shape", theme.shapes.full),
      itemHeight: "64px",
      iconSize: field(chrome, "icon-size", "24px"),
      iconGap: theme.spacing.xxs,
      labelStyle: theme.typography.labelMedium,
      direction: "column",
      showLabels: "always",
      indicatorColor: c.secondaryContainer,
      selectedIcon: c.onSecondaryContainer,
      selectedLabel: c.onSurface,
      icon: c.onSurfaceVariant,
      label: c.onSurfaceVariant,
      ...over,
    });
    return {
      bar: look("navigation-bar", {}),
      rail: look("navigation-rail", { indicatorWidth: "56px" }),
      drawer: look("navigation-drawer", {
        indicator: "pill",
        itemHeight: field("navigation-drawer", "item-height", "56px"),
        indicatorShape: field("navigation-drawer", "item-shape", theme.shapes.full),
        iconGap: theme.spacing.l,
        labelStyle: theme.typography.labelLarge,
        direction: "row",
        indicatorColor: c.secondaryContainer,
        selectedIcon: c.onSecondaryContainer,
        selectedLabel: c.onSecondaryContainer,
        icon: c.onSurfaceVariant,
        label: c.onSurface,
      }),
    };
  },
};

/** Material's navigation bar: 80 tall. */
export const materialNavigationBar: Renderer<
  NavigationBarState,
  NavigationBarSlots,
  NavigationBarStyle
> = {
  ...navigationBarBase,
  defaults(theme) {
    return {
      placement: "pinned",
      height: field("navigation-bar", "height", "80px"),
      floatingMargin: field("navigation-bar", "floating-margin", theme.spacing.l),
      floatingShape: field("navigation-bar", "floating-shape", theme.shapes.full),
      iconSize: field("navigation-bar", "icon-size", "24px"),
      indicatorWidth: field("navigation-bar", "indicator-width", "64px"),
      indicatorHeight: field("navigation-bar", "indicator-height", "32px"),
      indicatorShape: field("navigation-bar", "indicator-shape", theme.shapes.full),
      container: theme.colors.surfaceContainer,
      divider: "transparent",
      hairline: "1px",
    };
  },
};

/** Material's navigation rail. */
export const materialNavigationRail: Renderer<
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
      iconSize: field("navigation-rail", "icon-size", "24px"),
      indicatorWidth: field("navigation-rail", "indicator-width", "56px"),
      indicatorHeight: field("navigation-rail", "indicator-height", "32px"),
      container: theme.colors.surface,
      divider: "transparent",
      hairline: "1px",
    };
  },
};

/** Material's navigation drawer. */
export const materialNavigationDrawer: Renderer<
  NavigationDrawerState,
  NavigationDrawerSlots,
  NavigationDrawerStyle
> = {
  ...navigationDrawerBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      width: field("navigation-drawer", "width", "360px"),
      itemHeight: field("navigation-drawer", "item-height", "56px"),
      itemShape: field("navigation-drawer", "item-shape", theme.shapes.full),
      modalShape: field("navigation-drawer", "modal-shape", theme.shapes.large),
      scrimAlpha: field("navigation-drawer", "scrim-alpha", "32%"),
      container: c.surface,
      modalContainer: c.surfaceContainerLow,
      divider: "transparent",
      hairline: "1px",
    };
  },
};
