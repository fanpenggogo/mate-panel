// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

const Clutter = imports.gi.Clutter;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Meta = imports.gi.Meta;
const St = imports.gi.St;
const Shell = imports.gi.Shell;

const AltTab = imports.ui.altTab;
const WorkspaceSwitcherPopup = imports.ui.workspaceSwitcherPopup;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;

const SHELL_KEYBINDINGS_SCHEMA = 'org.gnome.shell.keybindings';
const WINDOW_ANIMATION_TIME = 0.25;
const DIM_BRIGHTNESS = -0.3;
const DIM_TIME = 0.500;
const UNDIM_TIME = 0.250;


const WindowDimmer = new Lang.Class({
    Name: 'WindowDimmer',

    _init: function(actor) {
        this._brightnessEffect = new Clutter.BrightnessContrastEffect();
        actor.add_effect(this._brightnessEffect);
        this.actor = actor;
        this._enabled = true;
        this._dimFactor = 0.0;
        this._syncEnabled();
    },

    _syncEnabled: function() {
        this._brightnessEffect.enabled = (this._enabled && this._dimFactor > 0);
    },

    setEnabled: function(enabled) {
        this._enabled = enabled;
        this._syncEnabled();
    },

    set dimFactor(factor) {
        this._dimFactor = factor;
        this._brightnessEffect.set_brightness(factor * DIM_BRIGHTNESS);
        this._syncEnabled();
    },

    get dimFactor() {
        return this._dimFactor;
    }
});

function getWindowDimmer(actor) {
    let enabled = Meta.prefs_get_attach_modal_dialogs();
    if (actor._windowDimmer)
        actor._windowDimmer.setEnabled(enabled);

    if (enabled) {
        if (!actor._windowDimmer)
            actor._windowDimmer = new WindowDimmer(actor);
        return actor._windowDimmer;
    } else {
        return null;
    }
}

const WindowManager = new Lang.Class({
    Name: 'WindowManager',

    _init : function() {
        this._shellwm =  global.window_manager;

        this._minimizing = [];
        this._maximizing = [];
        this._unmaximizing = [];
        this._mapping = [];
        this._destroying = [];
        this._movingWindow = null;

        this._dimmedWindows = [];

        this._animationBlockCount = 0;

        this._allowedKeybindings = {};

        this._switchData = null;
        this._shellwm.connect('kill-switch-workspace', Lang.bind(this, this._switchWorkspaceDone));
        this._shellwm.connect('kill-window-effects', Lang.bind(this, function (shellwm, actor) {
            this._minimizeWindowDone(shellwm, actor);
            this._maximizeWindowDone(shellwm, actor);
            this._unmaximizeWindowDone(shellwm, actor);
            this._mapWindowDone(shellwm, actor);
            this._destroyWindowDone(shellwm, actor);
        }));

        this._shellwm.connect('switch-workspace', Lang.bind(this, this._switchWorkspace));
        this._shellwm.connect('minimize', Lang.bind(this, this._minimizeWindow));
        this._shellwm.connect('maximize', Lang.bind(this, this._maximizeWindow));
        this._shellwm.connect('unmaximize', Lang.bind(this, this._unmaximizeWindow));
        this._shellwm.connect('map', Lang.bind(this, this._mapWindow));
        this._shellwm.connect('destroy', Lang.bind(this, this._destroyWindow));
        this._shellwm.connect('filter-keybinding', Lang.bind(this, this._filterKeybinding));

        this._workspaceSwitcherPopup = null;
        this.setCustomKeybindingHandler('switch-to-workspace-left',
                                        Shell.KeyBindingMode.NORMAL |
                                        Shell.KeyBindingMode.OVERVIEW,
                                        Lang.bind(this, this._showWorkspaceSwitcher));
        this.setCustomKeybindingHandler('switch-to-workspace-right',
                                        Shell.KeyBindingMode.NORMAL |
                                        Shell.KeyBindingMode.OVERVIEW,
                                        Lang.bind(this, this._showWorkspaceSwitcher));
        this.setCustomKeybindingHandler('switch-to-workspace-up',
                                        Shell.KeyBindingMode.NORMAL |
                                        Shell.KeyBindingMode.OVERVIEW,
                                        Lang.bind(this, this._showWorkspaceSwitcher));
        this.setCustomKeybindingHandler('switch-to-workspace-down',
                                        Shell.KeyBindingMode.NORMAL |
                                        Shell.KeyBindingMode.OVERVIEW,
                                        Lang.bind(this, this._showWorkspaceSwitcher));
        this.setCustomKeybindingHandler('move-to-workspace-left',
                                        Shell.KeyBindingMode.NORMAL |
                                        Shell.KeyBindingMode.OVERVIEW,
                                        Lang.bind(this, this._showWorkspaceSwitcher));
        this.setCustomKeybindingHandler('move-to-workspace-right',
                                        Shell.KeyBindingMode.NORMAL |
                                        Shell.KeyBindingMode.OVERVIEW,
                                        Lang.bind(this, this._showWorkspaceSwitcher));
        this.setCustomKeybindingHandler('move-to-workspace-up',
                                        Shell.KeyBindingMode.NORMAL |
                                        Shell.KeyBindingMode.OVERVIEW,
                                        Lang.bind(this, this._showWorkspaceSwitcher));
        this.setCustomKeybindingHandler('move-to-workspace-down',
                                        Shell.KeyBindingMode.NORMAL |
                                        Shell.KeyBindingMode.OVERVIEW,
                                        Lang.bind(this, this._showWorkspaceSwitcher));
        this.allowKeybinding('switch-to-workspace-1',
                             Shell.KeyBindingMode.NORMAL |
                             Shell.KeyBindingMode.OVERVIEW);
        this.allowKeybinding('switch-to-workspace-2',
                             Shell.KeyBindingMode.NORMAL |
                             Shell.KeyBindingMode.OVERVIEW);
        this.allowKeybinding('switch-to-workspace-3',
                             Shell.KeyBindingMode.NORMAL |
                             Shell.KeyBindingMode.OVERVIEW);
        this.allowKeybinding('switch-to-workspace-4',
                             Shell.KeyBindingMode.NORMAL |
                             Shell.KeyBindingMode.OVERVIEW);
        this.allowKeybinding('switch-to-workspace-5',
                             Shell.KeyBindingMode.NORMAL |
                             Shell.KeyBindingMode.OVERVIEW);
        this.allowKeybinding('switch-to-workspace-6',
                             Shell.KeyBindingMode.NORMAL |
                             Shell.KeyBindingMode.OVERVIEW);
        this.allowKeybinding('switch-to-workspace-7',
                             Shell.KeyBindingMode.NORMAL |
                             Shell.KeyBindingMode.OVERVIEW);
        this.allowKeybinding('switch-to-workspace-8',
                             Shell.KeyBindingMode.NORMAL |
                             Shell.KeyBindingMode.OVERVIEW);
        this.allowKeybinding('switch-to-workspace-9',
                             Shell.KeyBindingMode.NORMAL |
                             Shell.KeyBindingMode.OVERVIEW);
        this.allowKeybinding('switch-to-workspace-10',
                             Shell.KeyBindingMode.NORMAL |
                             Shell.KeyBindingMode.OVERVIEW);
        this.allowKeybinding('switch-to-workspace-11',
                             Shell.KeyBindingMode.NORMAL |
                             Shell.KeyBindingMode.OVERVIEW);
        this.allowKeybinding('switch-to-workspace-12',
                             Shell.KeyBindingMode.NORMAL |
                             Shell.KeyBindingMode.OVERVIEW);
        this.setCustomKeybindingHandler('switch-applications',
                                        Shell.KeyBindingMode.NORMAL,
                                        Lang.bind(this, this._startAppSwitcher));
        this.setCustomKeybindingHandler('switch-group',
                                        Shell.KeyBindingMode.NORMAL,
                                        Lang.bind(this, this._startAppSwitcher));
        this.setCustomKeybindingHandler('switch-applications-backward',
                                        Shell.KeyBindingMode.NORMAL,
                                        Lang.bind(this, this._startAppSwitcher));
        this.setCustomKeybindingHandler('switch-group-backward',
                                        Shell.KeyBindingMode.NORMAL,
                                        Lang.bind(this, this._startAppSwitcher));
        this.setCustomKeybindingHandler('switch-windows',
                                        Shell.KeyBindingMode.NORMAL,
                                        Lang.bind(this, this._startWindowSwitcher));
        this.setCustomKeybindingHandler('switch-windows-backward',
                                        Shell.KeyBindingMode.NORMAL,
                                        Lang.bind(this, this._startWindowSwitcher));
        this.setCustomKeybindingHandler('switch-panels',
                                        Shell.KeyBindingMode.NORMAL |
                                        Shell.KeyBindingMode.OVERVIEW |
                                        Shell.KeyBindingMode.LOCK_SCREEN |
                                        Shell.KeyBindingMode.UNLOCK_SCREEN |
                                        Shell.KeyBindingMode.LOGIN_SCREEN,
                                        Lang.bind(this, this._startA11ySwitcher));
        this.setCustomKeybindingHandler('switch-panels-backward',
                                        Shell.KeyBindingMode.NORMAL |
                                        Shell.KeyBindingMode.OVERVIEW |
                                        Shell.KeyBindingMode.LOCK_SCREEN |
                                        Shell.KeyBindingMode.UNLOCK_SCREEN |
                                        Shell.KeyBindingMode.LOGIN_SCREEN,
                                        Lang.bind(this, this._startA11ySwitcher));

        this.addKeybinding('open-application-menu',
                           new Gio.Settings({ schema: SHELL_KEYBINDINGS_SCHEMA }),
                           Meta.KeyBindingFlags.NONE,
                           Shell.KeyBindingMode.NORMAL |
                           Shell.KeyBindingMode.TOPBAR_POPUP,
                           Lang.bind(this, this._toggleAppMenu));

        Main.overview.connect('showing', Lang.bind(this, function() {
            for (let i = 0; i < this._dimmedWindows.length; i++)
                this._undimWindow(this._dimmedWindows[i]);
        }));
        Main.overview.connect('hiding', Lang.bind(this, function() {
            for (let i = 0; i < this._dimmedWindows.length; i++)
                this._dimWindow(this._dimmedWindows[i]);
        }));
    },

    setCustomKeybindingHandler: function(name, modes, handler) {
        if (Meta.keybindings_set_custom_handler(name, handler))
            this.allowKeybinding(name, modes);
    },

    addKeybinding: function(name, settings, flags, modes, handler) {
        let action = global.display.add_keybinding(name, settings, flags, handler);
        if (action != Meta.KeyBindingAction.NONE)
            this.allowKeybinding(name, modes);
        return action;
    },

    removeKeybinding: function(name) {
        if (global.display.remove_keybinding(name))
            this.allowKeybinding(name, Shell.KeyBindingMode.NONE);
    },

    allowKeybinding: function(name, modes) {
        this._allowedKeybindings[name] = modes;
    },

    blockAnimations: function() {
        this._animationBlockCount++;
    },

    unblockAnimations: function() {
        this._animationBlockCount = Math.max(0, this._animationBlockCount - 1);
    },

    _shouldAnimate: function() {
        return !(Main.overview.visible || this._animationBlockCount > 0);
    },

    _shouldAnimateActor: function(actor) {
        if (!this._shouldAnimate())
            return false;
        let windowType = actor.meta_window.get_window_type();
        return windowType == Meta.WindowType.NORMAL ||
            windowType == Meta.WindowType.MODAL_DIALOG;
    },

    _removeEffect : function(list, actor) {
        let idx = list.indexOf(actor);
        if (idx != -1) {
            list.splice(idx, 1);
            return true;
        }
        return false;
    },

    _minimizeWindow : function(shellwm, actor) {
        if (!this._shouldAnimateActor(actor)) {
            shellwm.completed_minimize(actor);
            return;
        }

        actor.set_scale(1.0, 1.0);

        this._minimizing.push(actor);

        if (actor.meta_window.is_monitor_sized()) {
            Tweener.addTween(actor,
                         { opacity: 0,
                           time: WINDOW_ANIMATION_TIME,
                           transition: 'easeOutQuad',
                           onComplete: this._minimizeWindowDone,
                           onCompleteScope: this,
                           onCompleteParams: [shellwm, actor],
                           onOverwrite: this._minimizeWindowOverwritten,
                           onOverwriteScope: this,
                           onOverwriteParams: [shellwm, actor]
                         });
        } else {
            let xDest, yDest, xScale, yScale;
            let [success, geom] = actor.meta_window.get_icon_geometry();
            if (success) {
                xDest = geom.x;
                yDest = geom.y;
                xScale = geom.width / actor.width;
                yScale = geom.height / actor.height;
            } else {
                let monitor = Main.layoutManager.monitors[actor.meta_window.get_monitor()];
                xDest = monitor.x;
                yDest = monitor.y;
                if (Clutter.get_default_text_direction() == Clutter.TextDirection.RTL)
                    xDest += monitor.width;
                xScale = 0;
                yScale = 0;
            }

            Tweener.addTween(actor,
                             { scale_x: xScale,
                               scale_y: yScale,
                               x: xDest,
                               y: yDest,
                               time: WINDOW_ANIMATION_TIME,
                               transition: 'easeOutQuad',
                               onComplete: this._minimizeWindowDone,
                               onCompleteScope: this,
                               onCompleteParams: [shellwm, actor],
                               onOverwrite: this._minimizeWindowOverwritten,
                               onOverwriteScope: this,
                               onOverwriteParams: [shellwm, actor]
                             });
        }
    },

    _minimizeWindowDone : function(shellwm, actor) {
        if (this._removeEffect(this._minimizing, actor)) {
            Tweener.removeTweens(actor);
            actor.set_scale(1.0, 1.0);
            actor.set_opacity(255);
            actor.move_anchor_point_from_gravity(Clutter.Gravity.NORTH_WEST);

            shellwm.completed_minimize(actor);
        }
    },

    _minimizeWindowOverwritten : function(shellwm, actor) {
        if (this._removeEffect(this._minimizing, actor)) {
            shellwm.completed_minimize(actor);
        }
    },

    _maximizeWindow : function(shellwm, actor, targetX, targetY, targetWidth, targetHeight) {
        shellwm.completed_maximize(actor);
    },

    _maximizeWindowDone : function(shellwm, actor) {
    },

    _maximizeWindowOverwrite : function(shellwm, actor) {
    },

    _unmaximizeWindow : function(shellwm, actor, targetX, targetY, targetWidth, targetHeight) {
        shellwm.completed_unmaximize(actor);
    },

    _unmaximizeWindowDone : function(shellwm, actor) {
    },

    _hasAttachedDialogs: function(window, ignoreWindow) {
        var count = 0;
        window.foreach_transient(function(win) {
            if (win != ignoreWindow && win.is_attached_dialog())
                count++;
            return false;
        });
        return count != 0;
    },

    _checkDimming: function(window, ignoreWindow) {
        let shouldDim = this._hasAttachedDialogs(window, ignoreWindow);

        if (shouldDim && !window._dimmed) {
            window._dimmed = true;
            this._dimmedWindows.push(window);
            if (!Main.overview.visible)
                this._dimWindow(window);
        } else if (!shouldDim && window._dimmed) {
            window._dimmed = false;
            this._dimmedWindows = this._dimmedWindows.filter(function(win) {
                                                                 return win != window;
                                                             });
            if (!Main.overview.visible)
                this._undimWindow(window);
        }
    },

    _dimWindow: function(window) {
        let actor = window.get_compositor_private();
        if (!actor)
            return;
        let dimmer = getWindowDimmer(actor);
        if (!dimmer)
            return;
        Tweener.addTween(dimmer,
                         { dimFactor: 1.0,
                           time: DIM_TIME,
                           transition: 'linear'
                         });
    },

    _undimWindow: function(window) {
        let actor = window.get_compositor_private();
        if (!actor)
            return;
        let dimmer = getWindowDimmer(actor);
        if (!dimmer)
            return;
        Tweener.addTween(dimmer,
                         { dimFactor: 0.0,
                           time: UNDIM_TIME,
                           transition: 'linear' });
    },

    _mapWindow : function(shellwm, actor) {
        actor._windowType = actor.meta_window.get_window_type();
        actor._notifyWindowTypeSignalId = actor.meta_window.connect('notify::window-type', Lang.bind(this, function () {
            let type = actor.meta_window.get_window_type();
            if (type == actor._windowType)
                return;
            if (type == Meta.WindowType.MODAL_DIALOG ||
                actor._windowType == Meta.WindowType.MODAL_DIALOG) {
                let parent = actor.get_meta_window().get_transient_for();
                if (parent)
                    this._checkDimming(parent);
            }

            actor._windowType = type;
        }));

        if (!this._shouldAnimateActor(actor)) {
            shellwm.completed_map(actor);
            return;
        }

        if (actor.meta_window.is_attached_dialog()) {
            /* Scale the window from the center of the parent */
            this._checkDimming(actor.get_meta_window().get_transient_for());
            actor.set_scale(1.0, 0.0);
            actor.scale_gravity = Clutter.Gravity.CENTER;
            actor.show();
            this._mapping.push(actor);

            Tweener.addTween(actor,
                             { scale_y: 1,
                               time: WINDOW_ANIMATION_TIME,
                               transition: "easeOutQuad",
                               onComplete: this._mapWindowDone,
                               onCompleteScope: this,
                               onCompleteParams: [shellwm, actor],
                               onOverwrite: this._mapWindowOverwrite,
                               onOverwriteScope: this,
                               onOverwriteParams: [shellwm, actor]
                             });
        } else {
            /* Fade window in */
            actor.opacity = 0;
            actor.show();
            this._mapping.push(actor);

            Tweener.addTween(actor,
                             { opacity: 255,
                               time: WINDOW_ANIMATION_TIME,
                               transition: 'easeOutQuad',
                               onComplete: this._mapWindowDone,
                               onCompleteScope: this,
                               onCompleteParams: [shellwm, actor],
                               onOverwrite: this._mapWindowOverwrite,
                               onOverwriteScope: this,
                               onOverwriteParams: [shellwm, actor]
                             });
        }
    },

    _mapWindowDone : function(shellwm, actor) {
        if (this._removeEffect(this._mapping, actor)) {
            Tweener.removeTweens(actor);
            actor.opacity = 255;
            actor.scale_y = 1;
            shellwm.completed_map(actor);
        }
    },

    _mapWindowOverwrite : function(shellwm, actor) {
        if (this._removeEffect(this._mapping, actor)) {
            shellwm.completed_map(actor);
        }
    },

    _destroyWindow : function(shellwm, actor) {
        let window = actor.meta_window;
        if (actor._notifyWindowTypeSignalId) {
            window.disconnect(actor._notifyWindowTypeSignalId);
            actor._notifyWindowTypeSignalId = 0;
        }
        if (window._dimmed) {
            this._dimmedWindows = this._dimmedWindows.filter(function(win) {
                                                                 return win != window;
                                                             });
        }

        if (!this._shouldAnimateActor(actor)) {
            shellwm.completed_destroy(actor);
            return;
        }

        this._destroying.push(actor);

        if (window.is_attached_dialog()) {
            let parent = window.get_transient_for();
            this._checkDimming(parent, window);

            actor.set_scale(1.0, 1.0);
            actor.scale_gravity = Clutter.Gravity.CENTER;
            actor.show();

            actor._parentDestroyId = parent.connect('unmanaged', Lang.bind(this, function () {
                Tweener.removeTweens(actor);
                this._destroyWindowDone(shellwm, actor);
            }));

            Tweener.addTween(actor,
                             { scale_y: 0,
                               time: WINDOW_ANIMATION_TIME,
                               transition: "easeOutQuad",
                               onComplete: this._destroyWindowDone,
                               onCompleteScope: this,
                               onCompleteParams: [shellwm, actor],
                               onOverwrite: this._destroyWindowDone,
                               onOverwriteScope: this,
                               onOverwriteParams: [shellwm, actor]
                             });
            return;
        }
        shellwm.completed_destroy(actor);
    },

    _destroyWindowDone : function(shellwm, actor) {
        if (this._removeEffect(this._destroying, actor)) {
            let parent = actor.get_meta_window().get_transient_for();
            if (parent && actor._parentDestroyId) {
                parent.disconnect(actor._parentDestroyId);
                actor._parentDestroyId = 0;
            }
            shellwm.completed_destroy(actor);
        }
    },

    _filterKeybinding: function(shellwm, binding) {
        if (Main.keybindingMode == Shell.KeyBindingMode.NONE)
            return true;

        // There's little sense in implementing a keybinding in mutter and
        // not having it work in NORMAL mode; handle this case generically
        // so we don't have to explicitly allow all builtin keybindings in
        // NORMAL mode.
        if (Main.keybindingMode == Shell.KeyBindingMode.NORMAL &&
            binding.is_builtin())
            return false;

        return !(this._allowedKeybindings[binding.get_name()] & Main.keybindingMode);
    },

    _switchWorkspace : function(shellwm, from, to, direction) {
        if (!this._shouldAnimate()) {
            shellwm.completed_switch_workspace();
            return;
        }

        let windows = global.get_window_actors();

        /* @direction is the direction that the "camera" moves, so the
         * screen contents have to move one screen's worth in the
         * opposite direction.
         */
        let xDest = 0, yDest = 0;

        if (direction == Meta.MotionDirection.UP ||
            direction == Meta.MotionDirection.UP_LEFT ||
            direction == Meta.MotionDirection.UP_RIGHT)
                yDest = global.screen_height - Main.panel.actor.height;
        else if (direction == Meta.MotionDirection.DOWN ||
            direction == Meta.MotionDirection.DOWN_LEFT ||
            direction == Meta.MotionDirection.DOWN_RIGHT)
                yDest = -global.screen_height + Main.panel.actor.height;

        if (direction == Meta.MotionDirection.LEFT ||
            direction == Meta.MotionDirection.UP_LEFT ||
            direction == Meta.MotionDirection.DOWN_LEFT)
                xDest = global.screen_width;
        else if (direction == Meta.MotionDirection.RIGHT ||
                 direction == Meta.MotionDirection.UP_RIGHT ||
                 direction == Meta.MotionDirection.DOWN_RIGHT)
                xDest = -global.screen_width;

        let switchData = {};
        this._switchData = switchData;
        switchData.inGroup = new Clutter.Actor();
        switchData.outGroup = new Clutter.Actor();
        switchData.movingWindowBin = new Clutter.Actor();
        switchData.windows = [];

        let wgroup = global.window_group;
        wgroup.add_actor(switchData.inGroup);
        wgroup.add_actor(switchData.outGroup);
        wgroup.add_actor(switchData.movingWindowBin);

        for (let i = 0; i < windows.length; i++) {
            let window = windows[i];

            if (!window.meta_window.showing_on_its_workspace())
                continue;

            if (this._movingWindow && window.meta_window == this._movingWindow) {
                switchData.movingWindow = { window: window,
                                            parent: window.get_parent() };
                switchData.windows.push(switchData.movingWindow);
                window.reparent(switchData.movingWindowBin);
            } else if (window.get_workspace() == from) {
                switchData.windows.push({ window: window,
                                          parent: window.get_parent() });
                window.reparent(switchData.outGroup);
            } else if (window.get_workspace() == to) {
                switchData.windows.push({ window: window,
                                          parent: window.get_parent() });
                window.reparent(switchData.inGroup);
                window.show();
            }
        }

        switchData.inGroup.set_position(-xDest, -yDest);
        switchData.inGroup.raise_top();

        switchData.movingWindowBin.raise_top();

        Tweener.addTween(switchData.outGroup,
                         { x: xDest,
                           y: yDest,
                           time: WINDOW_ANIMATION_TIME,
                           transition: 'easeOutQuad',
                           onComplete: this._switchWorkspaceDone,
                           onCompleteScope: this,
                           onCompleteParams: [shellwm]
                         });
        Tweener.addTween(switchData.inGroup,
                         { x: 0,
                           y: 0,
                           time: WINDOW_ANIMATION_TIME,
                           transition: 'easeOutQuad'
                         });
    },

    _switchWorkspaceDone : function(shellwm) {
        let switchData = this._switchData;
        if (!switchData)
            return;
        this._switchData = null;

        for (let i = 0; i < switchData.windows.length; i++) {
                let w = switchData.windows[i];
                if (w.window.is_destroyed()) // Window gone
                    continue;
                if (w.window.get_parent() == switchData.outGroup) {
                    w.window.reparent(w.parent);
                    w.window.hide();
                } else
                    w.window.reparent(w.parent);
        }
        Tweener.removeTweens(switchData.inGroup);
        Tweener.removeTweens(switchData.outGroup);
        switchData.inGroup.destroy();
        switchData.outGroup.destroy();
        switchData.movingWindowBin.destroy();

        if (this._movingWindow)
            this._movingWindow = null;

        shellwm.completed_switch_workspace();
    },

    _startAppSwitcher : function(display, screen, window, binding) {
        /* prevent a corner case where both popups show up at once */
        if (this._workspaceSwitcherPopup != null)
            this._workspaceSwitcherPopup.destroy();

        let tabPopup = new AltTab.AppSwitcherPopup();

        let modifiers = binding.get_modifiers();
        let backwards = modifiers & Meta.VirtualModifier.SHIFT_MASK;
        if (!tabPopup.show(backwards, binding.get_name(), binding.get_mask()))
            tabPopup.destroy();
    },

    _startWindowSwitcher : function(display, screen, window, binding) {
        /* prevent a corner case where both popups show up at once */
        if (this._workspaceSwitcherPopup != null)
            this._workspaceSwitcherPopup.destroy();

        let tabPopup = new AltTab.WindowSwitcherPopup();

        let modifiers = binding.get_modifiers();
        let backwards = modifiers & Meta.VirtualModifier.SHIFT_MASK;
        if (!tabPopup.show(backwards, binding.get_name(), binding.get_mask()))
            tabPopup.destroy();
    },

    _startA11ySwitcher : function(display, screen, window, binding) {
        let modifiers = binding.get_modifiers();
        let backwards = modifiers & Meta.VirtualModifier.SHIFT_MASK;
        Main.ctrlAltTabManager.popup(backwards, binding.get_name(), binding.get_mask());
    },

    _toggleAppMenu : function(display, screen, window, event, binding) {
        Main.panel.toggleAppMenu();
    },

    _showWorkspaceSwitcher : function(display, screen, window, binding) {
        if (screen.n_workspaces == 1)
            return;

        let [action,,,direction] = binding.get_name().split('-');
        let direction = Meta.MotionDirection[direction.toUpperCase()];
        let newWs;


        if (direction != Meta.MotionDirection.UP &&
            direction != Meta.MotionDirection.DOWN)
            return;

        if (action == 'switch')
            newWs = this.actionMoveWorkspace(direction);
        else
            newWs = this.actionMoveWindow(window, direction);

        if (!Main.overview.visible) {
            if (this._workspaceSwitcherPopup == null) {
                this._workspaceSwitcherPopup = new WorkspaceSwitcherPopup.WorkspaceSwitcherPopup();
                this._workspaceSwitcherPopup.connect('destroy', Lang.bind(this, function() {
                    this._workspaceSwitcherPopup = null;
                }));
            }
            this._workspaceSwitcherPopup.display(direction, newWs.index());
        }
    },

    actionMoveWorkspace: function(direction) {
        let activeWorkspace = global.screen.get_active_workspace();
        let toActivate = activeWorkspace.get_neighbor(direction);

        if (activeWorkspace != toActivate)
            toActivate.activate(global.get_current_time());

        return toActivate;
    },

    actionMoveWindow: function(window, direction) {
        let activeWorkspace = global.screen.get_active_workspace();
        let toActivate = activeWorkspace.get_neighbor(direction);

        if (activeWorkspace != toActivate) {
            // This won't have any effect for "always sticky" windows
            // (like desktop windows or docks)

            this._movingWindow = window;
            window.change_workspace(toActivate);

            global.display.clear_mouse_mode();
            toActivate.activate_with_focus (window, global.get_current_time());
        }

        return toActivate;
    },
});
