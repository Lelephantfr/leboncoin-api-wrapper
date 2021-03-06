const rp = require('request-promise');
const categoriesEnum = require('../enum/categories.enum');
const estateTypesEnum = require('../enum/estateTypes.enum');

class Finder {
  setKeywords(keywords) {
    this.keywords = keywords;
  }

  setPage(page) {
    this.page = page;
  }

  setOrder(order) {
    this.order = order;
  }

  setLimit(limit) {
    this.limit = limit;
  }

  setCategory(category) {
    this.category = categoriesEnum[category.toUpperCase()];
  }

  setMinPrice(price) {
    this.minPrice = price;
  }

  setMaxPrice(price) {
    this.maxPrice = price;
  }

  setLocations(locations) {
    this.locations = locations;
  }

  setMinRooms(rooms) {
    this.minRooms = rooms;
  }

  setMaxRooms(rooms) {
    this.maxRooms = rooms;
  }

  setMinSquare(square) {
    this.minSquare = square;
  }

  setMaxSquare(square) {
    this.maxSquare = square;
  }

  setEstateType(types) {
    this.estateTypes = [];
    types.forEach((type) => this.estateTypes.push(estateTypesEnum[type.toUpperCase()].toString()));
  }

  setFurnished(furnished) {
    this.furnished = [];
    furnished === true ? this.furnished.push('1') : this.furnished.push('2');
  }

  setSellType(sellType) {
    this.sellType = sellType;
  }

  getKeywords() {
    return this.keywords;
  }

  getPage() {
    return this.page;
  }

  getOrder() {
    return this.order;
  }

  getLimit() {
    return this.limit;
  }

  getCategory() {
    return this.category ? this.category.toString() : null;
  }

  getMinPrice() {
    return this.minPrice;
  }

  getMaxPrice() {
    return this.maxPrice;
  }

  getLocations() {
    return this.locations;
  }

  getMinRooms() {
    return this.minRooms;
  }

  getMaxRooms() {
    return this.maxRooms;
  }

  getMinSquare() {
    return this.minSquare;
  }

  getMaxSquare() {
    return this.maxSquare;
  }

  getEstateTypes() {
    return this.estateTypes;
  }

  getFurnished() {
    return this.furnished;
  }

  getSellType() {
    return this.sellType;
  }

  buildBody() {
    const body = {
      limit: this.getLimit(),
      page: this.getPage(),
      owner_type: 'all',
      sort_by: 'time',
      filters: {
        enums: {
          ad_type: ['offer'],
        },
        keywords: {
          type: 'all',
          text: this.getKeywords(),
        },
        ranges: {

        },
      },
      sort_order: this.getOrder(),
    };

    if (this.getCategory()) {
      Object.assign(body.filters, { category: { id: this.getCategory() } });
    }

    if (this.getMaxPrice() || this.getMinPrice()) {
      Object.assign(body.filters.ranges, { price: { min: this.getMinPrice(), max: this.getMaxPrice()} });
    }

    if (this.getLocations()) {
      Object.assign(body.filters, { location: { locations: this.getLocations() } });
    }

    if (this.getMinRooms() || this.getMaxRooms()) {
      Object.assign(body.filters.ranges, { rooms: { min: this.getMinRooms(), max: this.getMaxRooms() } });
    }

    if (this.getMinSquare() || this.getMaxSquare()) {
      Object.assign(body.filters.ranges, { square: { min: this.getMinSquare(), max: this.getMaxSquare() } });
    }

    if (this.getEstateTypes()) {
      Object.assign(body.filters.enums, { real_estate_type: this.getEstateTypes() });
    }

    if (this.getFurnished()) {
      Object.assign(body.filters.enums, { furnished: this.getFurnished() });
    }

    if (this.getSellType()) {
      Object.assign(body.filters.enums, { immo_sell_type: this.getSellType() });
    }

    return JSON.stringify(body);
  }

  // eslint-disable-next-line class-methods-use-this
  async getPhoneNumber(id) {
    const options = {
      method: 'POST',
      uri: 'https://api.leboncoin.fr/api/utils/phonenumber.json',
      headers: {
        Host: 'api.leboncoin.fr',
        'User-Agent': 'LBC;iOS;13.2.2;iPhone;phone;08AE8CBB-0C52-4881-BFF4-01F3E7F627F2;wifi;5.4.8;12.12',
      },
      form: {
        list_id: id,
      },
      transform: JSON.parse,
    };

    try {
      const { utils } = await rp(options);
      return utils.phonenumber;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async getFormattedAds(ads) {
    const formattedAds = [];

    for await (const ad of ads) {
      if (ad.has_phone) {
        ad.phone_number = await this.getPhoneNumber(ad.list_id);
      }

      formattedAds.push(ad);
    }

    return formattedAds;
  }

  async search() {
    const json = this.buildBody();
    const options = {
      method: 'POST',
      uri: 'https://api.leboncoin.fr/finder/search',
      headers: {
        Host: 'api.leboncoin.fr',
        'User-Agent': 'LBC;iOS;13.2.2;iPhone;phone;08AE8CBB-0C52-4881-BFF4-01F3E7F627F2;wifi;5.4.8;12.12',
        'Content-Type': 'application/json',
      },
      body: json,
      transform: JSON.parse,
    };

    try {
      const resp = await rp(options);

      const ads = await this.getFormattedAds(resp.ads);

      return {
        currentPage: this.page,
        pages: Math.ceil(resp.total / this.limit),
        results: resp.total,
        ads,
      };
    } catch (e) {
      return Promise.reject(e);
    }
  }
}

module.exports = Finder;
