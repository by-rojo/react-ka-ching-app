const WPAPI = require('wpapi')
const axios = require('axios')

const runWP = ({ WP_URL, WP_USER, WP_PASS, WP_STATUS, WEBHOOK_URL, SEED_ID }) => {
    const wp = new WPAPI({
        endpoint: WP_URL + '/wp-json',
        username: WP_USER,
        password: WP_PASS,
    })

    wp.reactKaChingWebhook = wp.registerRoute('react-ka-ching-wp/v1', '/seed/(?P<id>\\d+)', {
        params: [
            'id'
        ]
    })


    wp.deals = wp.registerRoute('wc/v3', '/products/(?P<id>\\d+)', {
        params: [
            'sku',
            'id'
        ]
    })

    wp.productCategories = wp.registerRoute('wc/v3/products', '/categories', {
        params: [
            'per_page',
            'page'
        ]
    })

    // eslint-disable-next-line unused-imports/no-unused-vars
    const getCategories = async (classifications) => {
        const categories = await wp.productCategories().per_page('100').page(1)
        let currentSet = categories
        let page = 1
        while (currentSet?.length > 0) {
            try {
                // await recover()
                currentSet = await wp.productCategories().per_page('100').page(page)
                if (currentSet) {
                    currentSet.forEach(cat => {
                        categories.push(cat)
                    })
                    page++
                }
            } catch (e) {
                console.warn(e.message)
            }
        }

        const categoryId = categories.find(({ name }) => name === classifications)?.id
        const categoryIds = [
            { id: 15 }
        ]

        if (categoryId) {
            categoryIds[0].id = categoryId
        } else {
            const category = await wp.productCategories().create({
                name: classifications
            })
            categoryIds[0].id = category.id
        }

        return categoryIds
    }

    // we also need to upload images or set image urls and fix prices and dimensions

    const findProductId = async (sku) => {
        //await recover()
        const record = await wp.deals().sku(sku)
        return record[0].id
    }

    const getImages = (Images) => {
        const images = [
        ]

        if (Images) {
            Object.values(Images).forEach(imageType => {
                Object.values(imageType).forEach(
                    imageSizes => {
                        if (imageSizes.URL) {
                            images.push({ src: imageSizes.URL })
                        } else {
                            Object.values(imageSizes).forEach(image => {
                                images.push({ src: image.URL })
                            })
                        }
                    })
            })
        }

        return images
    }

    const setData = async ({
        ItemInfo,
        Offers,
        DetailPageURL,
        ASIN,
        Images,
    }) => {
        const categories = await getCategories(ItemInfo.Classifications.ProductGroup.DisplayValue)
        const price = Offers.Listings[0].Price.Amount + Math.floor((Math.random() * 10) + 1)
        const productData = {
            name: ItemInfo.Title.DisplayValue,
            description: ItemInfo.Features.DisplayValues.join('\r\n\r\n'),
            short_description: ItemInfo.Features.DisplayValues.join('\r\n\r\n'),
            type: 'external',
            //todo find cheapest price and highest price to determin the sale price
            price: Offers.Listings[0].Price.Amount.toString(),
            regular_price: price.toString(),
            sale_price: Offers.Listings[0].Price.Amount.toString(),
            dimensions: {
                length: ItemInfo.ProductInfo?.ItemDimensions?.Length?.toString(),
                width: ItemInfo.ProductInfo?.ItemDimensions?.Width?.toString(),
                height: ItemInfo.ProductInfo?.ItemDimensions?.Height?.toString()
            },
            categories,
            sku: ASIN,
            external_url: DetailPageURL,
            images: getImages(Images)
        }

        return productData
    }

    const recover = async (timeout = 1000) => {
        return await (new Promise((resolve) => {
            setTimeout(resolve, timeout)
        }))
    }

    const clearLine = () => {
        if (process.stdout.clearLine) {
            process.stdout.clearLine()
            process.stdout.cursorTo(0)
        }
    }

    return {
        start: async (_data, keyWords, searchIndex) => {
            let i
            let errorCount = 0;
            const { Items: items } = _data.SearchResult
            for (i = 0; i < items.length; i++) {
                clearLine();
                console.log(`🏃 running: ${items[i].ASIN}`)
                await recover()
                try {
                    const data = await setData(items[i])
                    const id = await findProductId(items[i].ASIN).catch(() => undefined)
                    if (id) await wp.deals().id(id).update(data)
                    else {
                        await wp.deals().create({
                            ...data,
                            status: WP_STATUS
                        })
                    }

                   const callbackParams = {
                        seedTotal: items.length,
                        seedCount: i + 1 - errorCount,
                        seedRemaining: items.length - 1 - i,
                        seedErrors: errorCount,
                        seedSearchKeywords: keyWords,
                        seedSearchIndex: searchIndex,
                        seedId: SEED_ID,
                    }

                    if(SEED_ID) {
                        await wp.reactKaChingWebhook().id(SEED_ID).update(callbackParams).catch(e => {
                            clearLine()
                            console.error("🙊 rka wp webhook error!", e.message || e)
                        })
                    }
                    if (WEBHOOK_URL) {
                         await axios.post(WEBHOOK_URL,callbackParams).catch(e => {
                            clearLine()
                            console.error("🙉 custom webhook error!", e.message || e)
                        })
                    }
                    clearLine();
                    console.log(`🕺 done! ${i}`)
                } catch (e) {
                    errorCount +=1;
                    clearLine();
                    console.error("💩 woops!", e.message)
                }
            }
        }
    }
}

module.exports = runWP