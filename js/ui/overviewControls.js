// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

const Clutter = imports.gi.Clutter;
const Lang = imports.lang;
const Meta = imports.gi.Meta;
const St = imports.gi.St;
const Shell = imports.gi.Shell;

const Main = imports.ui.main;
const Params = imports.misc.params;
const Tweener = imports.ui.tweener;
const ViewSelector = imports.ui.viewSelector;

const SIDE_CONTROLS_ANIMATION_TIME = 0.16;

function getRtlSlideDirection(direction, actor) {
    let rtl = (actor.text_direction == Clutter.TextDirection.RTL);
    if (rtl)
        direction = (direction == SlideDirection.LEFT) ?
            SlideDirection.RIGHT : SlideDirection.LEFT;

    return direction;
};

const SlideDirection = {
    LEFT: 0,
    RIGHT: 1
};

const SlideLayout = new Lang.Class({
    Name: 'SlideLayout',
    Extends: Clutter.FixedLayout,

    _init: function(params) {
        this._slideX = 1;
        this._direction = SlideDirection.LEFT;

        this.parent(params);
    },

    vfunc_get_preferred_width: function(container, forHeight) {
        let child = container.get_first_child();

        let [minWidth, natWidth] = child.get_preferred_width(forHeight);

        minWidth *= this._slideX;
        natWidth *= this._slideX;

        return [minWidth, natWidth];
    },

    vfunc_allocate: function(container, box, flags) {
        let child = container.get_first_child();

        let [, , natWidth, natHeight] = child.get_preferred_size();
        let availWidth = Math.round(box.x2 - box.x1);
        let availHeight = Math.round(box.y2 - box.y1);

        let realDirection = getRtlSlideDirection(this._direction, child);
        let translationX = (realDirection == SlideDirection.LEFT) ?
            (availWidth - natWidth) : (natWidth - availWidth);

        let actorBox = new Clutter.ActorBox({ x1: translationX,
                                              y1: 0,
                                              x2: child.x_expand ? availWidth : natWidth,
                                              y2: child.y_expand ? availHeight : natHeight });

        child.allocate(actorBox, flags);
    },

    set slideX(value) {
        this._slideX = value;
        this.layout_changed();
    },

    get slideX() {
        return this._slideX;
    },

    set slideDirection(direction) {
        this._direction = direction;
        this.layout_changed();
    },

    get slideDirection() {
        return this._direction;
    }
});

const SlidingControl = new Lang.Class({
    Name: 'SlidingControl',

    _init: function(params) {
        params = Params.parse(params, { slideDirection: SlideDirection.LEFT });

        this.visible = true;
        this.inDrag = false;

        this.layout = new SlideLayout();
        this.layout.slideDirection = params.slideDirection;
        this.actor = new St.Widget({ layout_manager: this.layout,
                                     style_class: 'overview-controls',
                                     clip_to_allocation: true });

        Main.overview.connect('showing', Lang.bind(this, this._onOverviewShowing));

        Main.overview.connect('item-drag-begin', Lang.bind(this, this._onDragBegin));
        Main.overview.connect('item-drag-end', Lang.bind(this, this._onDragEnd));
        Main.overview.connect('item-drag-cancelled', Lang.bind(this, this._onDragEnd));

        Main.overview.connect('window-drag-begin', Lang.bind(this, this._onWindowDragBegin));
        Main.overview.connect('window-drag-cancelled', Lang.bind(this, this._onWindowDragEnd));
        Main.overview.connect('window-drag-end', Lang.bind(this, this._onWindowDragEnd));
    },

    getSlide: function() {
        throw new Error('getSlide() must be overridden');
    },

    updateSlide: function() {
        Tweener.addTween(this.layout, { slideX: this.getSlide(),
                                        time: SIDE_CONTROLS_ANIMATION_TIME,
                                        transition: 'easeOutQuad' });
    },

    getVisibleWidth: function() {
        let child = this.actor.get_first_child();
        let [, , natWidth, ] = child.get_preferred_size();
        return natWidth;
    },

    _getTranslation: function() {
        let child = this.actor.get_first_child();
        let direction = getRtlSlideDirection(this.layout.slideDirection, child);
        let visibleWidth = this.getVisibleWidth();

        if (direction == SlideDirection.LEFT)
            return - visibleWidth;
        else
            return visibleWidth;
    },

    _updateTranslation: function() {
        let translationStart = 0;
        let translationEnd = 0;
        let translation = this._getTranslation();

        if (this.visible) {
            translationStart = translation;
        } else {
            translationEnd = translation;
        }

        if (this.actor.translation_x == translationEnd)
            return;

        this.actor.translation_x = translationStart;
        Tweener.addTween(this.actor, { translation_x: translationEnd,
                                       time: SIDE_CONTROLS_ANIMATION_TIME,
                                       transition: 'easeOutQuad'
                                     });
    },

    _onOverviewShowing: function() {
        // reset any translation and make sure the actor is visible when
        // entering the overview
        this.visible = true;
        this.layout.slideX = this.getSlide();
        this.actor.translation_x = 0;
    },

    _onWindowDragBegin: function() {
        this._onDragBegin();
    },

    _onWindowDragEnd: function() {
        this._onDragEnd();
    },

    _onDragBegin: function() {
        this.inDrag = true;
        this.actor.translation_x = 0;
        this.updateSlide();
    },

    _onDragEnd: function() {
        this.inDrag = false;
        this.updateSlide();
    },

    fadeIn: function() {
        Tweener.addTween(this.actor, { opacity: 255,
                                       time: SIDE_CONTROLS_ANIMATION_TIME / 2,
                                       transition: 'easeInQuad'
                                     });
    },

    fadeHalf: function() {
        Tweener.addTween(this.actor, { opacity: 128,
                                       time: SIDE_CONTROLS_ANIMATION_TIME / 2,
                                       transition: 'easeOutQuad'
                                     });
    },

    slideIn: function() {
        this.visible = true;
        // we will update slideX and the translation from pageEmpty
    },

    slideOut: function() {
        this.visible = false;
        this._updateTranslation();
        // we will update slideX from pageEmpty
    },

    pageEmpty: function() {
        // When pageEmpty is received, there's no visible view in the
        // selector; this means we can now safely set the full slide for
        // the next page, since slideIn or slideOut might have been called,
        // changing the visiblity
        this.layout.slideX = this.getSlide();
        this._updateTranslation();
    }
});

const ThumbnailsSlider = new Lang.Class({
    Name: 'ThumbnailsSlider',
    Extends: SlidingControl,

    _init: function(thumbnailsBox) {
        this.parent({ slideDirection: SlideDirection.RIGHT });

        this._thumbnailsBox = thumbnailsBox;

        // SlideLayout reads the actor's expand flags to decide
        // whether to allocate the natural size to its child, or the whole
        // available allocation
        this._thumbnailsBox.actor.y_expand = true;

        this.actor.request_mode = Clutter.RequestMode.WIDTH_FOR_HEIGHT;
        this.actor.reactive = true;
        this.actor.track_hover = true;
        this.actor.add_actor(this._thumbnailsBox.actor);

        Main.layoutManager.connect('monitors-changed', Lang.bind(this, this.updateSlide));
        this.actor.connect('notify::hover', Lang.bind(this, this.updateSlide));
    },

    _getAlwaysZoomOut: function() {
        // Always show the pager when hover, during a drag, or if workspaces are
        // actually used, e.g. there are windows on more than one
        let alwaysZoomOut = this.actor.hover || this.inDrag || !Meta.prefs_get_dynamic_workspaces() || global.screen.n_workspaces > 2;

        if (!alwaysZoomOut) {
            let monitors = Main.layoutManager.monitors;
            let primary = Main.layoutManager.primaryMonitor;

            /* Look for any monitor to the right of the primary, if there is
             * one, we always keep zoom out, otherwise its hard to reach
             * the thumbnail area without passing into the next monitor. */
            for (let i = 0; i < monitors.length; i++) {
                if (monitors[i].x >= primary.x + primary.width) {
                    alwaysZoomOut = true;
                    break;
                }
            }
        }

        return alwaysZoomOut;
    },

    getSlide: function() {
        if (!this.visible)
            return 0;

        let alwaysZoomOut = this._getAlwaysZoomOut();
        if (alwaysZoomOut)
            return 1;

        let child = this.actor.get_first_child();
        let preferredHeight = child.get_preferred_height(-1)[1];
        let expandedWidth = child.get_preferred_width(preferredHeight)[1];
        let visibleWidth = child.get_theme_node().get_length('visible-width');

        return visibleWidth / expandedWidth;
    },

    getVisibleWidth: function() {
        let alwaysZoomOut = this._getAlwaysZoomOut();
        if (alwaysZoomOut)
            return this.parent();

        let child = this.actor.get_first_child();
        return child.get_theme_node().get_length('visible-width');
    }
});

const DashSlider = new Lang.Class({
    Name: 'DashSlider',
    Extends: SlidingControl,

    _init: function(dash) {
        this.parent({ slideDirection: SlideDirection.LEFT });

        this._dash = dash;

        // SlideLayout reads the actor's expand flags to decide
        // whether to allocate the natural size to its child, or the whole
        // available allocation
        this._dash.actor.x_expand = true;
        this._dash.actor.y_expand = true;
        this.actor.add_actor(this._dash.actor);

        this._dash.connect('icon-size-changed', Lang.bind(this, this.updateSlide));
    },

    getSlide: function() {
        if (this.visible || this.inDrag)
            return 1;
        else
            return 0;
    },

    _onWindowDragBegin: function() {
        this.fadeHalf();
    },

    _onWindowDragEnd: function() {
        this.fadeIn();
    }
});

const DashSpacer = new Lang.Class({
    Name: 'DashSpacer',
    Extends: St.Widget,

    _init: function(params) {
        this.parent(params);

        this._bindConstraint = null;
    },

    setDashActor: function(dashActor) {
        if (this._bindConstraint) {
            this.remove_constraint(this._bindConstraint);
            this._bindConstraint = null;
        }

        if (dashActor) {
            this._bindConstraint = new Clutter.BindConstraint({ source: dashActor,
                                                                coordinate: Clutter.BindCoordinate.SIZE });
            this.add_constraint(this._bindConstraint);
        }
    },

    vfunc_get_preferred_width: function(forHeight) {
        let box = this.get_allocation_box();
        let minWidth = this.parent(forHeight)[0];
        let natWidth = box.x2 - box.x1;
        return [minWidth, natWidth];
    },

    vfunc_get_preferred_height: function(forWidth) {
        let box = this.get_allocation_box();
        let minHeight = this.parent(forWidth)[0];
        let natHeight = box.y2 - box.y1;
        return [minHeight, natHeight];
    }
});

const MessagesIndicator = new Lang.Class({
    Name: 'MessagesIndicator',

    _init: function(viewSelector) {
        this._count = 0;
        this._sources = [];
        this._viewSelector = viewSelector;

        this._container = new St.BoxLayout({ style_class: 'messages-indicator-contents',
                                             reactive: true,
                                             track_hover: true,
                                             x_expand: true,
                                             y_expand: true,
                                             x_align: Clutter.ActorAlign.CENTER });

        this._icon = new St.Icon({ icon_name: 'user-idle-symbolic',
                                   icon_size: 16 });
        this._container.add_actor(this._icon);

        this._label = new St.Label();
        this._container.add_actor(this._label);

        this._highlight = new St.Widget({ style_class: 'messages-indicator-highlight',
                                          x_expand: true,
                                          y_expand: true,
                                          y_align: Clutter.ActorAlign.END,
                                          visible: false });

        this._container.connect('notify::hover', Lang.bind(this,
            function() {
                this._highlight.visible = this._container.hover;
            }));

        let clickAction = new Clutter.ClickAction();
        this._container.add_action(clickAction);
        clickAction.connect('clicked', Lang.bind(this,
            function() {
                Main.messageTray.openTray();
            }));

        Main.messageTray.connect('showing', Lang.bind(this,
            function() {
                this._highlight.visible = false;
                this._container.hover = false;
            }));

        let layout = new Clutter.BinLayout();
        this.actor = new St.Widget({ layout_manager: layout,
                                     style_class: 'messages-indicator',
                                     y_expand: true,
                                     y_align: Clutter.ActorAlign.END,
                                     visible: false });
        this.actor.add_actor(this._container);
        this.actor.add_actor(this._highlight);

        Main.messageTray.connect('source-added', Lang.bind(this, this._onSourceAdded));
        Main.messageTray.connect('source-removed', Lang.bind(this, this._onSourceRemoved));

        let sources = Main.messageTray.getSources();
        sources.forEach(Lang.bind(this, function(source) { this._onSourceAdded(null, source); }));

        this._viewSelector.connect('page-changed', Lang.bind(this, this._updateVisibility));
        Main.overview.connect('showing', Lang.bind(this, this._updateVisibility));
    },

    _onSourceAdded: function(tray, source) {
        if (source.trayIcon)
            return;

        if (source.isTransient)
            return;

        source.connect('count-updated', Lang.bind(this, this._updateCount));
        this._sources.push(source);
        this._updateCount();
    },

    _onSourceRemoved: function(tray, source) {
        this._sources.splice(this._sources.indexOf(source), 1);
        this._updateCount();
    },

    _updateCount: function() {
        let count = 0;
        let hasChats = false;
        this._sources.forEach(Lang.bind(this,
            function(source) {
                count += source.indicatorCount;
                hasChats |= source.isChat;
            }));

        this._count = count;
        this._label.text = ngettext("%d new message",
                                    "%d new messages",
                                   count).format(count);

        this._icon.visible = hasChats;
        this._updateVisibility();
    },

    _updateVisibility: function() {
        let activePage = this._viewSelector.getActivePage();
        let visible = ((this._count > 0) && (activePage == ViewSelector.ViewPage.WINDOWS));

        this.actor.visible = visible;
    }
});

const ControlsManager = new Lang.Class({
    Name: 'ControlsManager',

    _init: function(dash, thumbnails, viewSelector) {
        this._dashSlider = new DashSlider(dash);
        this.dashActor = this._dashSlider.actor;
        this.dashSpacer = new DashSpacer();
        this.dashSpacer.setDashActor(this.dashActor);

        this._thumbnailsSlider = new ThumbnailsSlider(thumbnails);
        this.thumbnailsActor = this._thumbnailsSlider.actor;

        this._indicator = new MessagesIndicator(viewSelector);
        this.indicatorActor = this._indicator.actor;

        this._viewSelector = viewSelector;
        this._viewSelector.connect('page-changed', Lang.bind(this, this._setVisibility));
        this._viewSelector.connect('page-empty', Lang.bind(this, this._onPageEmpty));

        Main.overview.connect('showing', Lang.bind(this, this._updateSpacerVisibility));
        Main.overview.connect('item-drag-begin', Lang.bind(this,
            function() {
                let activePage = this._viewSelector.getActivePage();
                if (activePage != ViewSelector.ViewPage.WINDOWS)
                    this._viewSelector.fadeHalf();
            }));
        Main.overview.connect('item-drag-end', Lang.bind(this,
            function() {
                this._viewSelector.fadeIn();
            }));
        Main.overview.connect('item-drag-cancelled', Lang.bind(this,
            function() {
                this._viewSelector.fadeIn();
            }));
    },

    _setVisibility: function() {
        // Ignore the case when we're leaving the overview, since
        // actors will be made visible again when entering the overview
        // next time, and animating them while doing so is just
        // unnecessary noise
        if (!Main.overview.visible ||
            (Main.overview.animationInProgress && !Main.overview.visibleTarget))
            return;

        let activePage = this._viewSelector.getActivePage();
        let dashVisible = (activePage == ViewSelector.ViewPage.WINDOWS ||
                           activePage == ViewSelector.ViewPage.APPS);
        let thumbnailsVisible = (activePage == ViewSelector.ViewPage.WINDOWS);

        if (dashVisible)
            this._dashSlider.slideIn();
        else
            this._dashSlider.slideOut();

        if (thumbnailsVisible)
            this._thumbnailsSlider.slideIn();
        else
            this._thumbnailsSlider.slideOut();
    },

    _updateSpacerVisibility: function() {
        if (Main.overview.animationInProgress && !Main.overview.visibleTarget)
            return;

        let activePage = this._viewSelector.getActivePage();
        this.dashSpacer.visible = (activePage == ViewSelector.ViewPage.WINDOWS);
    },

    _onPageEmpty: function() {
        this._dashSlider.pageEmpty();
        this._thumbnailsSlider.pageEmpty();

        this._updateSpacerVisibility();
    }
});
