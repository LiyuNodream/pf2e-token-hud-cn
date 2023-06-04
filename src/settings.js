import { enableModule, localize, MODULE_ID } from './module.js'

export function registerSettings() {
    /**
     * GM
     */
    const statuses = ['first', 'second', 'third', 'fourth'].map(x => localize(`settings.status.statuses.${x}`)).join(', ')
    register('status', String, statuses, { scope: 'world' })

    /**
     * CLIENT
     */
    register('enabled', Boolean, true, { onChange: enableModule })

    register('position', String, 'right', {
        choices: {
            left: path('position', 'choices.left'),
            right: path('position', 'choices.right'),
            top: path('position', 'choices.top'),
            bottom: path('position', 'choices.bottom'),
        },
    })

    register('delay', Number, 250, {
        range: {
            min: 0,
            max: 2000,
            step: 50,
        },
    })

    register('holding', String, 'none', {
        choices: {
            none: path('holding', 'choices.none'),
            owned: path('holding', 'choices.owned'),
            all: path('holding', 'choices.all'),
        },
    })

    register('no-death', Boolean, false)
    // registerSetting('info-click', Boolean, true)

    // distance

    register('distance', String, 'all', {
        choices: {
            none: path('distance', 'choices.none'),
            self: path('distance', 'choices.self'),
            all: path('distance', 'choices.all'),
        },
    })

    register('unit', String, '')

    // sidebar

    register('height', String, '')

    register('scrollbar', Boolean, true)

    register('spells-columns', Boolean, false)

    register('skills-columns', Boolean, false)

    // actions

    register('actions', String, 'split', {
        choices: {
            name: path('actions', 'choices.name'),
            type: path('actions', 'choices.type'),
            split: path('actions', 'choices.split'),
        },
    })

    register('actions-colors', Boolean, true)

    // spells

    register('spells', Boolean, false)

    register('tradition', Boolean, false)

    // skills

    register('untrained', Boolean, true)
}

export function renderSettingsConfig(_, html) {
    const tab = html.find(`.tab[data-tab=${MODULE_ID}]`)

    function beforeGroup(name, key, dom = 'h3') {
        const localized = localize(`menu.${key}`)
        tab.find(`[name="${MODULE_ID}.${name}"]`).closest('.form-group').before(`<${dom}>${localized}</${dom}>`)
    }

    if (game.user.isGM) {
        beforeGroup('enabled', 'client.header', 'h2')
    }

    beforeGroup('distance', 'client.distance')
    beforeGroup('height', 'client.sidebar')
    beforeGroup('actions', 'client.actions')
    beforeGroup('spells', 'client.spells')
    beforeGroup('untrained', 'client.skills')
}

function path(setting, key) {
    return `${MODULE_ID}.settings.${setting}.${key}`
}

function register(name, type, defValue, extra = {}) {
    game.settings.register(MODULE_ID, name, {
        name: path(name, 'name'),
        hint: path(name, 'hint'),
        scope: 'client',
        config: true,
        type,
        default: defValue,
        ...extra,
    })
}