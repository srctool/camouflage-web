import { css } from "lit";
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

/** Carbon's tab bar. */
export const carbonTabs: Renderer<TabsState, TabsSlots, TabsStyle> = {
  ...tabsBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      defaultAppearance: "ghost",
      kind: "underline",
      height: field(
        "tabs",
        "height",
        "var(--carbon-density-control, calc(48px - var(--camo-input-pointer, 0) * 8px))",
      ),
      heightWithIcon: field("tabs", "height-with-icon", "64px"),
      indicatorHeight: field("tabs", "indicator-height", "2px"),
      indicatorWidth: "tab",
      minTabWidth: field("tabs", "min-tab-width", "90px"),
      showDivider: true,
      iconSize: field("tabs", "icon-size", "16px"),
      iconGap: field("tabs", "icon-gap", theme.spacing.xs),
      tabPadding: field("tabs", "tab-padding", theme.spacing.l),
      shape: theme.shapes.none,
      labelStyle: theme.typography.bodyMedium,
      solid: {
        container: c.surfaceContainerHigh,
        selected: c.onSurface,
        unselected: c.onSurfaceVariant,
        indicator: c.primary,
        thumb: c.surface,
        divider: c.outlineVariant,
      },
      ghost: {
        container: c.surface,
        selected: c.onSurface,
        unselected: c.onSurfaceVariant,
        indicator: c.primary,
        thumb: c.surfaceContainerHigh,
        divider: c.outlineVariant,
      },
    };
  },
};

/** Carbon's tab. */
export const carbonTab: Renderer<TabState, TabSlots, TabsStyle> = {
  ...tabBase,
  defaults: (theme) => carbonTabs.defaults(theme),
};

/** Carbon's navigation item. */
export const carbonNavItem: Renderer<NavItemState, NavItemSlots, NavItemStyle> = {
  ...navItemBase,
  styles: [
    navItemBase.styles ?? [],
    css`
    /* The selected row of the side panel is tinted as well as marked by its line. */
    .line.row {
      background: color-mix(in srgb, var(--n-ind) 12%, transparent);
    }
    `,
  ],
  defaults(theme) {
    const c = theme.colors;
    const look = (chrome: string, over: Partial<NavItemLook>): NavItemLook => ({
      indicator: "line",
      indicatorWidth: field(chrome, "indicator-width", "24px"),
      indicatorHeight: field(chrome, "indicator-height", "2px"),
      indicatorShape: field(chrome, "indicator-shape", theme.shapes.none),
      itemHeight: "56px",
      iconSize: field(chrome, "icon-size", "20px"),
      iconGap: theme.spacing.xxs,
      labelStyle: theme.typography.labelMedium,
      direction: "column",
      showLabels: "always",
      indicatorColor: c.primary,
      selectedIcon: c.primary,
      selectedLabel: c.primary,
      icon: c.onSurfaceVariant,
      label: c.onSurfaceVariant,
      ...over,
    });
    return {
      bar: look("navigation-bar", {}),
      rail: look("navigation-rail", { itemHeight: "48px", showLabels: "never" }),
      drawer: look("navigation-drawer", {
        indicator: "line",
        itemHeight: field("navigation-drawer", "item-height", "48px"),
        indicatorHeight: "3px",
        indicatorShape: theme.shapes.none,
        iconGap: theme.spacing.l,
        labelStyle: theme.typography.labelLarge,
        direction: "row",
        indicatorColor: c.primary,
        selectedIcon: c.onSurface,
        selectedLabel: c.onSurface,
        icon: c.onSurfaceVariant,
        label: c.onSurface,
      }),
    };
  },
};

/** Carbon's navigation bar. */
export const carbonNavigationBar: Renderer<
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

/** Carbon's left panel as a rail: 48 of icons. */
export const carbonNavigationRail: Renderer<
  NavigationRailState,
  NavigationRailSlots,
  NavigationRailStyle
> = {
  ...navigationRailBase,
  defaults(theme) {
    return {
      alignment: "top",
      width: field("navigation-rail", "width", "48px"),
      itemSpacing: field("navigation-rail", "item-spacing", theme.spacing.s),
      iconSize: field("navigation-rail", "icon-size", "20px"),
      indicatorWidth: field("navigation-rail", "indicator-width", "56px"),
      indicatorHeight: field("navigation-rail", "indicator-height", "32px"),
      container: theme.colors.surface,
      divider: theme.colors.outlineVariant,
      hairline: "1px",
    };
  },
};

/** Carbon's navigation drawer. */
export const carbonNavigationDrawer: Renderer<
  NavigationDrawerState,
  NavigationDrawerSlots,
  NavigationDrawerStyle
> = {
  ...navigationDrawerBase,
  defaults(theme) {
    const c = theme.colors;
    return {
      width: field("navigation-drawer", "width", "256px"),
      itemHeight: field(
        "navigation-drawer",
        "item-height",
        "var(--carbon-density-control, calc(48px - var(--camo-input-pointer, 0) * 8px))",
      ),
      itemShape: field("navigation-drawer", "item-shape", theme.shapes.none),
      modalShape: field("navigation-drawer", "modal-shape", theme.shapes.none),
      scrimAlpha: field("navigation-drawer", "scrim-alpha", "50%"),
      container: c.surfaceContainerLow,
      modalContainer: c.surfaceContainerLow,
      divider: c.outlineVariant,
      hairline: "1px",
    };
  },
};
