import { localize, MODULE_ID } from './module.js'
import { addNameTooltipListeners } from './shared.js'

const ITEMS_ORDER = {
    weapon: 0,
    armor: 1,
    consumable: 2,
    equipment: 3,
}

const ITEMS_TYPES = {
    weapon: { order: 0, label: 'PF2E.InventoryWeaponsHeader' },
    armor: { order: 1, label: 'PF2E.InventoryArmorHeader' },
    consumable: { order: 2, label: 'PF2E.InventoryConsumablesHeader' },
    equipment: { order: 3, label: 'PF2E.InventoryEquipmentHeader' },
    treasure: { order: 4, label: 'PF2E.InventoryTreasureHeader' },
    backpack: { order: 5, label: 'PF2E.InventoryBackpackHeader' },
}

export function getItems(actor) {
    return actor.inventory.contents
    // return actor.inventory.filter(item => !item.isOfType('backpack', 'treasure'))
}

export async function getItemsData(actor) {
    const categories = {}

    for (const item of getItems(actor)) {
        categories[item.type] ??= []
        categories[item.type].push(item)
    }

    return {
        categories: Object.entries(categories)
            .map(([type, items]) => {
                items.sort((a, b) => a.name.localeCompare(b.name))
                return { type, items, label: ITEMS_TYPES[type].label }
            })
            .sort((a, b) => ITEMS_TYPES[a.type].order - ITEMS_TYPES[b.type].order),
    }
}

export function addItemsListeners(el, actor) {
    addNameTooltipListeners(el.find('.item'))

    // new DragDrop({
    //     dragSelector: '.item',
    //     dropSelector: null,
    //     permissions: {
    //         dragstart: () => true,
    //         drop: () => false,
    //     },
    //     callbacks: {
    //         dragstart: event => {
    //             const target = event.target.closest('.item')
    //             const { itemType, uuid } = target.dataset

    //             const img = new Image()
    //             img.src = target.querySelector('.item-img img').src
    //             img.style.width = '32px'
    //             img.style.height = '32px'
    //             img.style.borderRadius = '4px'
    //             img.style.position = 'absolute'
    //             img.style.left = '-1000px'
    //             document.body.append(img)

    //             event.dataTransfer.setDragImage(img, 16, 16)
    //             event.dataTransfer.setData('text/plain', JSON.stringify({ type: 'Item', fromInventory: true, itemType, uuid }))
    //         },
    //     },
    // }).bind(el[0])

    const hud = el.closest(`#${MODULE_ID}`)

    el.find('.item').on('dragstart', event => {
        hud.css('opacity', 0.1)

        const target = event.target.closest('.item')
        const { itemType, uuid } = target.dataset

        const img = new Image()
        img.src = target.querySelector('.item-img img').src
        img.style.width = '32px'
        img.style.height = '32px'
        img.style.borderRadius = '4px'
        img.style.position = 'absolute'
        img.style.left = '-1000px'
        document.body.append(img)

        event.originalEvent.dataTransfer.setDragImage(img, 16, 16)
        event.originalEvent.dataTransfer.setData(
            'text/plain',
            JSON.stringify({ type: 'Item', fromInventory: true, itemType, uuid })
        )

        target.addEventListener(
            'dragend',
            () => {
                hud.css('opacity', 1)
                hud.css('pointerEvents', '')
            },
            { once: true }
        )
    })

    el.find('.quantity input').on('change', event => {
        getItemFromEvent(event, actor)?.update({ 'system.quantity': event.currentTarget.valueAsNumber })
    })

    el.find('[data-action=toggle-item-invest]').on('click', event => {
        event.preventDefault()
        const { itemId } = event.currentTarget.closest('.item').dataset
        actor.toggleInvested(itemId)
    })

    el.find('[data-action=repair-item]').on('click', event => {
        event.preventDefault()
        const item = getItemFromEvent(event, actor)
        if (item) game.pf2e.actions.repair({ item, actors: [actor] })
    })

    el.find('[data-action=toggle-identified]').on('click', event => {
        event.preventDefault()
        const item = getItemFromEvent(event, actor)
        if (!item) return
        if (item.isIdentified) item.setIdentificationStatus('unidentified')
        else item.setIdentificationStatus('identified')
    })

    el.find('[data-action=edit-item]').on('click', event => {
        event.preventDefault()
        const item = getItemFromEvent(event, actor)
        item?.sheet.render(true, { focus: true })
    })

    el.find('[data-action=delete-item]').on('click', async event => {
        event.preventDefault()

        const item = getItemFromEvent(event, actor)
        if (!item) return

        if (event.ctrlKey) return item.delete()

        new Dialog({
            title: localize('items.delete.title'),
            content: await renderTemplate('systems/pf2e/templates/actors/delete-item-dialog.hbs', { name: item.name }),
            buttons: {
                ok: {
                    icon: '<i class="fa-solid fa-trash"></i>',
                    label: localize('items.delete.ok'),
                    callback: () => item.delete(),
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: localize('items.delete.cancel'),
                },
            },
        }).render(true)
    })

    el.find('[data-action=toggle-item-worn').tooltipster({
        animation: 'fade',
        delay: 0,
        animationDuration: 10,
        trigger: 'click',
        contentAsHTML: true,
        interactive: true,
        arrow: false,
        side: ['bottom', 'top'],
        theme: 'crb-hover',
        minWidth: 120,
        content: '',
        functionBefore: async function (tooltipster, { event, origin }) {
            const item = getItemFromEvent(event, actor)
            if (!item) return

            const tmp = document.createElement('div')
            tmp.innerHTML = await renderTemplate('systems/pf2e/templates/actors/partials/carry-type.hbs', { item })

            const content = tmp.children[1]
            $(content)
                .find('[data-carry-type]')
                .on('click', event => {
                    const { carryType, handsHeld = 0, inSlot } = $(event.currentTarget).data()
                    actor.adjustCarryType(item, carryType, handsHeld, inSlot)
                    tooltipster.close()
                })

            tooltipster.content(content)
        },
    })
}

function getItemFromEvent(event, actor) {
    const { itemId } = event.currentTarget.closest('[data-item-id]').dataset
    return actor.items.get(itemId)
}