const bonusForSellers = {
    'first__bonus': 0.15,
    'secondary__bonus': 0.1,
    'third__bonus': 0.05,
    'fourth__bonus': 0,
}

/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
    const discount = 1 - (purchase.discount / 100);
    return purchase.sale_price * purchase.quantity * discount;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller;

    if (index === 0) {
        return +(profit * bonusForSellers['first__bonus']).toFixed(2);
    } else if (index === 1 || index === 2) {
        return +(profit * bonusForSellers['secondary__bonus']).toFixed(2);
    } else if (index === total - 1) {
        return 0;
    } else {
        return +(profit * bonusForSellers['third__bonus']).toFixed(2);
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных

    if (!Array.isArray(data.sellers) || data.sellers.length === 0) {
        throw new Error('Некорректные входные данные для покупателей');
    }

    if (!Array.isArray(data.products) || data.products.length === 0) {
        throw new Error('Некорректные входные данные для продуктов');
    }

    if (!Array.isArray(data.purchase_records) || data.purchase_records.length === 0) {
        throw new Error('Некорректные входные данные для чеков');
    }

    // @TODO: Проверка наличия опций

    if (typeof options !== "object" || options === null) {
        throw new Error('Опции отсутствуют');
    }

    const { calculateRevenue, calculateBonus } = options;

    if (!calculateRevenue || !calculateBonus) {
        throw new Error('Функции отсутствуют')
    }

    if (
        typeof calculateRevenue !== "function" ||
        typeof calculateBonus !== "function"
    ) {
        throw new Error("Опции не являются функциями");
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики

    const sellerStats = data.sellers.map((seller) => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {},
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа

    const sellerIndex = Object.fromEntries(sellerStats.map(item => [item.id, item]));
    const productIndex = Object.fromEntries(data.products.map(item => [item.sku, item]));

    data.purchase_records.forEach(record => { // Чек
        const seller = sellerIndex[record.seller_id];
        seller.revenue = seller.revenue + record.total_amount;
        seller.sales_count = seller.sales_count + 1;

        record.items.forEach(item => {
            const product = productIndex[item.sku]; // Товар
            const cost = product.purchase_price * item.quantity;
            const revenue = calculateRevenue(item);
            const profit = revenue - cost;
            seller.profit += profit;

            // Учёт количества проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }

            seller.products_sold[item.sku] += item.quantity;
        });
    });

    sellerStats.sort((a, b) => b.profit - a.profit);

    sellerStats.forEach((seller, index) => {
        seller.bonus = Number(calculateBonus(index, sellerStats.length, seller));
        seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({sku, quantity}))
            .sort((a, b) => {b.quantity - a.quantity})
            .slice(0, 10);
    });


    return sellerStats.map(seller => (
        {
            seller_id : seller.id,
            name: seller.name,
            revenue: +seller.revenue.toFixed(2),
            profit: +seller.profit.toFixed(2),
            sales_count: seller.sales_count,
            top_products: seller.top_products,
            bonus: Number(seller.bonus).toFixed(2),
        }
    ));
}
