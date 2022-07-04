const ProductAdvertisingAPIv1 = require('paapi5-nodejs-sdk')
const defaultClient = ProductAdvertisingAPIv1.ApiClient.instance

const runAmazon = ({
  AMAZON_ACCESS_KEY,
  AMAZON_SECRET_KEY,
  AMAZON_PARTNER_TAG,
  AMAZON_KEYWORDS,
  AMAZON_SEARCH_INDEX,
  AMAZON_HOST =  'webservices.amazon.com',
  AMAZON_REGION = 'us-east-1'
}) => {
  const MAX_PAGES = 10 // API LIMITATION: cant ask for more than 10 pages AND 10 results per page
  const START_PAGE = 1
  // Specify your credentials here. These are used to create and sign the request.
  defaultClient.accessKey = AMAZON_ACCESS_KEY
  defaultClient.secretKey = AMAZON_SECRET_KEY

  /**
   * Specify Host and Region to which you want to send the request to.
   * For more details refer:
   * https://webservices.amazon.com/paapi5/documentation/common-request-parameters.html#host-and-region
   */
  defaultClient.host = AMAZON_HOST
  defaultClient.region = AMAZON_REGION

  const api = new ProductAdvertisingAPIv1.DefaultApi()

  /**
   * The following is a sample request for SearchItems operation.
   * For more information on Product Advertising API 5.0 Operations,
   * refer: https://webservices.amazon.com/paapi5/documentation/operations.html
   */
  const searchItemsRequest = new ProductAdvertisingAPIv1.SearchItemsRequest()

  /** Enter your partner tag (store/tracking id) and partner type */
  searchItemsRequest['PartnerTag'] = AMAZON_PARTNER_TAG
  searchItemsRequest['PartnerType'] = 'Associates'

  // Specify search keywords
  searchItemsRequest['Keywords'] = AMAZON_KEYWORDS

  /**
    * Specify the category in which search request is to be made.
    * For more details, refer:
    * https://webservices.amazon.com/paapi5/documentation/use-cases/organization-of-items-on-amazon/search-index.html
    */
  searchItemsRequest['SearchIndex'] = AMAZON_SEARCH_INDEX

  // Specify the number of items to be returned in search result
  searchItemsRequest['ItemCount'] = MAX_PAGES
  searchItemsRequest['ItemPage'] = START_PAGE

  /**
    * Choose resources you want from SearchItemsResource enum
    * For more details, refer: https://webservices.amazon.com/paapi5/documentation/search-items.html#resources-parameter
    */
  searchItemsRequest['Resources'] = [
    'Images.Primary.Large',
    'Images.Variants.Large',
    'ItemInfo.Title',
    'ItemInfo.Features',
    'ItemInfo.ManufactureInfo',
    'ItemInfo.ProductInfo',
    'ItemInfo.TechnicalInfo',
    'ItemInfo.Classifications',
    'Offers.Listings.Price'
  ]

  return {
    start: async () => {
      let currentPage = START_PAGE
      let allData

      while (currentPage < MAX_PAGES + 1) {
        const dataSet = await (new Promise((resolve, reject) => {
          searchItemsRequest['ItemPage'] = currentPage
          currentPage += 1
          api.searchItems(searchItemsRequest, (error, data) => {
            setTimeout(() => {
              if (error) return reject({ error })
              else return resolve({ data })
            }, 1000) //api throttle
          })
        }))
        allData = allData || dataSet.data
        dataSet?.data?.SearchResult?.Items?.forEach((item) => {
          allData?.SearchResult.Items.push(item)
        })
      }
      return Promise.resolve(allData)
    }
  }
}

module.exports = runAmazon