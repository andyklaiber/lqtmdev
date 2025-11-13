'use strict'

const { test } = require('tap');
const { getCategoryPrice, processStartRegistration } = require('../../../api/payments/index.js');

// ============================================================================
// HYBRID CATEGORY MODEL TESTS - getCategoryPrice function
// Tests match the override hierarchy in RaceReg.vue and EditRaceComponent.vue
// ============================================================================

test('getCategoryPrice - returns payment option unchanged when no series data', async (t) => {
    const paymentOption = {
        name: 'Regular Entry',
        type: 'regular',
        amount: 40
    };
    
    const seriesData = null;
    
    const result = getCategoryPrice(paymentOption, 'adult_men', seriesData, null);
    
    t.same(result, paymentOption, 'Should return payment option unchanged');
});

test('getCategoryPrice - applies series group pricing when category is in group', async (t) => {
    const paymentOption = {
        name: 'Season Pass',
        type: 'season',
        amount: 400  // Race default amount
    };
    
    const seriesData = {
        categoryGroups: [
            {
                name: 'expert',
                categories: ['pro_men', 'pro_women', 'expert_men_18_minus_44'],
                paymentOptions: [
                    {
                        type: 'season',
                        name: 'Expert Season Pass',
                        amount: 275  // Series group amount - should be used
                    }
                ]
            },
            {
                name: 'Sport',
                categories: ['sport_men_18_minus_44', 'sport_women'],
                paymentOptions: [
                    {
                        type: 'season',
                        name: 'Sport Season Pass',
                        amount: 265
                    }
                ]
            }
        ]
    };
    
    const result = getCategoryPrice(paymentOption, 'pro_men', seriesData, null);
    
    t.equal(result.amount, 275, 'Should apply series expert group pricing (275, not race default 400)');
    t.equal(result.name, 'Expert Season Pass', 'Should use series expert group name');
});

test('getCategoryPrice - applies sport group pricing for sport category', async (t) => {
    const paymentOption = {
        name: 'Season Pass',
        type: 'season',
        amount: 400
    };
    
    const seriesData = {
        categoryGroups: [
            {
                name: 'expert',
                categories: ['pro_men', 'pro_women'],
                paymentOptions: [
                    {
                        type: 'season',
                        name: 'Expert Season Pass',
                        amount: 275
                    }
                ]
            },
            {
                name: 'Sport',
                categories: ['sport_men_18_minus_44', 'sport_women'],
                paymentOptions: [
                    {
                        type: 'season',
                        name: 'Sport Season Pass',
                        amount: 265
                    }
                ]
            }
        ]
    };
    
    const result = getCategoryPrice(paymentOption, 'sport_women', seriesData, null);
    
    t.equal(result.amount, 265, 'Should apply series sport group pricing');
    t.equal(result.name, 'Sport Season Pass', 'Should use series sport group name');
});

test('getCategoryPrice - uses race payment option when category not in any group', async (t) => {
    const paymentOption = {
        name: 'Season Pass',
        type: 'season',
        amount: 350
    };
    
    const seriesData = {
        categoryGroups: [
            {
                name: 'expert',
                categories: ['pro_men', 'pro_women'],
                paymentOptions: [
                    {
                        type: 'season',
                        name: 'Expert Season Pass',
                        amount: 275
                    }
                ]
            }
        ]
    };
    
    const result = getCategoryPrice(paymentOption, 'masters_men', seriesData, null);
    
    t.equal(result.amount, 350, 'Should use race payment amount when category not in any group');
    t.equal(result.name, 'Season Pass', 'Should use race payment name');
});

// ============================================================================
// INTEGRATION TESTS - processStartRegistration function
// Tests use Bear Off-Road 2026 series data structure
// ============================================================================

test('processStartRegistration - handles cash payment', async (t) => {
    const regData = {
        raceid: 'test-race-1',
        paytype: 'cash',
        category: 'pro_men',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com'
    };
    
    const raceData = {
        displayName: 'Test Race',
        regCategories: [
            { id: 'pro_men', catdispname: 'Pro Men', paytype: 'adult' }
        ],
        paymentOptions: [
            { name: 'Adult Entry', type: 'adult', amount: 75 }
        ],
        stripeMeta: { accountId: 'acct_test' }
    };
    
    const insertedId = 'payment_123';
    const mockMongo = {
        payments: {
            insertOne: async () => ({ insertedId }),
            updateOne: async () => ({})
        },
        races: {
            updateOne: async () => ({})
        }
    };
    
    const dependencies = {
        mongo: mockMongo,
        createStripeSession: async () => ({}),
        registerRacer: async () => ({}),
        log: { info: () => {} }
    };
    
    const result = await processStartRegistration({ regData, raceData, dependencies });
    
    t.ok(result.redirect.includes('regconfirmation'), 'Should return redirect URL');
    t.ok(result.redirect.includes(insertedId), 'Should include payment ID in URL');
});

test('processStartRegistration - handles sponsored category', async (t) => {
    const regData = {
        raceid: 'test-race-1',
        paytype: 'regular',
        category: 'sponsored_cat',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com'
    };
    
    const raceData = {
        displayName: 'Test Race',
        regCategories: [
            { id: 'sponsored_cat', catdispname: 'Sponsored Category', sponsored: true }
        ],
        paymentOptions: [
            { name: 'Regular', type: 'regular', amount: 40 }
        ],
        stripeMeta: { accountId: 'acct_test' }
    };
    
    let racerRegistered = false;
    const insertedId = 'payment_456';
    
    const mockMongo = {
        payments: {
            insertOne: async () => ({ insertedId }),
            updateOne: async () => ({})
        },
        races: {
            updateOne: async () => ({})
        }
    };
    
    const dependencies = {
        mongo: mockMongo,
        createStripeSession: async () => ({}),
        registerRacer: async () => { racerRegistered = true; },
        log: { info: () => {} }
    };
    
    const result = await processStartRegistration({ regData, raceData, dependencies });
    
    t.ok(result.redirect.includes('regconfirmation'), 'Should return redirect URL');
    t.ok(racerRegistered, 'Should have registered the racer');
    t.equal(regData.paytype, 'season', 'Should set paytype to season');
});

test('processStartRegistration - applies expert group pricing for season pass (Bear Off-Road)', async (t) => {
    const regData = {
        raceid: '2026_exchequer_off_minus_road',
        paytype: 'season',
        category: 'pro_men',
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'bob@example.com'
    };
    
    const raceData = {
        displayName: '2026 Exchequer Off-Road',
        regCategories: [
            { id: 'pro_men', catdispname: 'Pro Men', paytype: 'adult', _isSeriesCategory: true },
            { id: 'sport_women', catdispname: 'Sport Women', paytype: 'adult', _isSeriesCategory: true }
        ],
        paymentOptions: [
            {
                name: 'Adult Entry',
                type: 'adult',
                amount: 75  // Race-specific single entry
            }
        ],
        seriesData: {
            seriesId: 'bear_offroad_2026',
            categoryGroups: [
                {
                    name: 'expert',
                    categories: ['pro_men', 'pro_women', 'expert_men_18_minus_44', 'expert_men_age_45_plus_', 'expert_women'],
                    paymentOptions: [
                        {
                            type: 'season',
                            name: 'Expert Season Pass',
                            amount: 275  // Should be used for pro_men
                        }
                    ]
                },
                {
                    name: 'Sport',
                    categories: ['sport_men_18_minus_44', 'sport_men_45_plus_', 'sport_women'],
                    paymentOptions: [
                        {
                            type: 'season',
                            name: 'Sport Season Pass',
                            amount: 265
                        }
                    ]
                }
            ]
        },
        stripeMeta: { accountId: 'acct_test' },
        isTestData: false
    };
    
    let capturedStripeConfig = null;
    
    const dependencies = {
        mongo: {
            payments: {
                insertOne: async () => ({ insertedId: 'payment_789' }),
                updateOne: async () => ({})
            },
            races: {
                updateOne: async () => ({})
            }
        },
        createStripeSession: async ({ sessionConfig }) => {
            capturedStripeConfig = sessionConfig;
            return {
                url: 'https://stripe.com/checkout/session',
                paymentRecordId: 'payment_789',
                sessionId: 'cs_test_123'
            };
        },
        registerRacer: async () => ({}),
        log: { info: () => {} }
    };
    
    const result = await processStartRegistration({ regData, raceData, dependencies });
    
    t.ok(result.redirect.includes('stripe.com'), 'Should return Stripe URL');
    t.ok(capturedStripeConfig, 'Should have called Stripe with config');
    
    // Check that expert pricing was applied (275 * 100 = 27500 cents base)
    // Plus fees calculated by getFees
    const unitAmount = capturedStripeConfig.line_items[0].price_data.unit_amount;
    t.ok(unitAmount > 27500, 'Should include expert pricing plus fees');
    t.ok(unitAmount < 35000, 'Should be less than higher tier pricing');
    
    // Check that pricing was tracked in regData
    t.equal(regData.categoryPricingApplied, true, 'Should mark category pricing as applied');
    t.equal(regData.pricingAmount, 275, 'Should store expert amount');
    t.equal(regData.pricingName, 'Expert Season Pass', 'Should store expert name');
});

test('processStartRegistration - applies Fresh/Soph/Middle group pricing (Bear Off-Road)', async (t) => {
    const regData = {
        raceid: '2026_exchequer_off_minus_road',
        paytype: 'season',
        category: 'middle_school_girls',
        first_name: 'Alice',
        last_name: 'Cooper',
        email: 'alice@example.com'
    };
    
    const raceData = {
        displayName: '2026 Exchequer Off-Road',
        regCategories: [
            { id: 'pro_men', catdispname: 'Pro Men', paytype: 'adult', _isSeriesCategory: true },
            { id: 'middle_school_girls', catdispname: 'Middle School Girls', paytype: '18under', _isSeriesCategory: true }
        ],
        paymentOptions: [
            {
                name: 'Adult Entry',
                type: 'adult',
                amount: 75
            },
            {
                name: '18- Juniors',
                type: '18under',
                amount: 55
            }
        ],
        seriesData: {
            seriesId: 'bear_offroad_2026',
            categoryGroups: [
                {
                    name: 'expert',
                    categories: ['pro_men', 'pro_women', 'expert_men_18_minus_44', 'expert_men_age_45_plus_', 'expert_women'],
                    paymentOptions: [
                        {
                            type: 'season',
                            name: 'Expert Season Pass',
                            amount: 275
                        }
                    ]
                },
                {
                    name: 'Fresh/Soph/Middle',
                    categories: ['freshsoph_boys', 'freshsoph_girls', 'middle_school_boys', 'middle_school_girls'],
                    paymentOptions: [
                        {
                            type: 'season',
                            name: 'Season Pass',
                            amount: 185  // Should be used for middle_school_girls
                        }
                    ]
                }
            ]
        },
        stripeMeta: { accountId: 'acct_test' },
        isTestData: false
    };
    
    let capturedStripeConfig = null;
    
    const dependencies = {
        mongo: {
            payments: {
                insertOne: async () => ({ insertedId: 'payment_999' }),
                updateOne: async () => ({})
            },
            races: {
                updateOne: async () => ({})
            }
        },
        createStripeSession: async ({ sessionConfig }) => {
            capturedStripeConfig = sessionConfig;
            return {
                url: 'https://stripe.com/checkout/session',
                paymentRecordId: 'payment_999',
                sessionId: 'cs_test_456'
            };
        },
        registerRacer: async () => ({}),
        log: { info: () => {} }
    };
    
    const result = await processStartRegistration({ regData, raceData, dependencies });
    
    t.ok(result.redirect.includes('stripe.com'), 'Should return Stripe URL');
    t.ok(capturedStripeConfig, 'Should have called Stripe with config');
    
    // Check that Fresh/Soph/Middle pricing was applied (185 * 100 = 18500 cents base)
    const unitAmount = capturedStripeConfig.line_items[0].price_data.unit_amount;
    t.ok(unitAmount > 18500, 'Should include junior pricing plus fees');
    t.ok(unitAmount < 25000, 'Should be significantly less than adult pricing');
    
    // Check that junior pricing was tracked
    t.equal(regData.categoryPricingApplied, true, 'Should mark category pricing as applied');
    t.equal(regData.pricingAmount, 185, 'Should store Fresh/Soph/Middle amount');
    t.equal(regData.pricingName, 'Season Pass', 'Should store Fresh/Soph/Middle name');
});

test('processStartRegistration - uses single race entry (adult paytype) without season pass', async (t) => {
    const regData = {
        raceid: '2026_exchequer_off_minus_road',
        paytype: 'adult',  // User selected single race entry
        category: 'pro_men',
        first_name: 'Charlie',
        last_name: 'Brown',
        email: 'charlie@example.com'
    };
    
    const raceData = {
        displayName: '2026 Exchequer Off-Road',
        regCategories: [
            { id: 'pro_men', catdispname: 'Pro Men', paytype: 'adult', _isSeriesCategory: true }
        ],
        paymentOptions: [
            {
                name: 'Adult Entry',
                type: 'adult',
                amount: 75
            }
        ],
        seriesData: {
            seriesId: 'bear_offroad_2026',
            categoryGroups: [
                {
                    name: 'expert',
                    categories: ['pro_men', 'pro_women', 'expert_men_18_minus_44'],
                    paymentOptions: [
                        {
                            type: 'season',
                            name: 'Expert Season Pass',
                            amount: 275
                        }
                    ]
                }
            ]
        },
        stripeMeta: { accountId: 'acct_test' },
        isTestData: false
    };
    
    let capturedStripeConfig = null;
    
    const dependencies = {
        mongo: {
            payments: {
                insertOne: async () => ({ insertedId: 'payment_111' }),
                updateOne: async () => ({})
            },
            races: {
                updateOne: async () => ({})
            }
        },
        createStripeSession: async ({ sessionConfig }) => {
            capturedStripeConfig = sessionConfig;
            return {
                url: 'https://stripe.com/checkout/session',
                paymentRecordId: 'payment_111',
                sessionId: 'cs_test_789'
            };
        },
        registerRacer: async () => ({}),
        log: { info: () => {} }
    };
    
    const result = await processStartRegistration({ regData, raceData, dependencies });
    
    t.ok(result.redirect.includes('stripe.com'), 'Should return Stripe URL');
    t.ok(capturedStripeConfig, 'Should have called Stripe with config');
    
    // Check that single race pricing was applied (75 * 100 = 7500 cents base)
    const unitAmount = capturedStripeConfig.line_items[0].price_data.unit_amount;
    t.ok(unitAmount > 7500, 'Should include single race pricing plus fees');
    t.ok(unitAmount < 12000, 'Should be less than season pass pricing');
    
    // Check that category pricing was NOT tracked (no series group pricing used, just race payment)
    t.notOk(regData.categoryPricingApplied, 'Should not mark category pricing as applied for single race entry');
});

test('processStartRegistration - series category allows season pass despite having forced single-race paytype', async (t) => {
    const regData = {
        raceid: '2026_exchequer_off_minus_road',
        paytype: 'season', // User explicitly selects season pass
        category: 'pro_men',  // Category has paytype: 'adult' for single-race entries, but allows season pass
        first_name: 'Timmy',
        last_name: 'Test',
        email: 'timmy@example.com'
    };
    
    const raceData = {
        displayName: '2026 Exchequer Off-Road',
        regCategories: [
            { 
                id: 'pro_men', 
                catdispname: 'Pro Men', 
                paytype: 'adult',  // This is for single-race entries only, not a hard constraint
                _isSeriesCategory: true
            }
        ],
        paymentOptions: [
            {
                name: 'Adult Entry',
                type: 'adult',
                amount: 75
            },
            {
                name: '18- Juniors',
                type: '18under',
                amount: 55
            }
        ],
        seriesData: {
            seriesId: 'bear_offroad_2026',
            categoryGroups: [
                {
                    name: 'expert',
                    categories: ['pro_men', 'pro_women'],
                    paymentOptions: [
                        {
                            type: 'season',
                            name: 'Expert Season Pass',
                            amount: 275
                        }
                    ]
                }
            ]
        },
        stripeMeta: { accountId: 'acct_test' },
        isTestData: false
    };
    
    let capturedStripeConfig = null;
    
    const dependencies = {
        mongo: {
            payments: {
                insertOne: async () => ({ insertedId: 'payment_222' }),
                updateOne: async () => ({})
            },
            races: {
                updateOne: async () => ({})
            }
        },
        createStripeSession: async ({ sessionConfig }) => {
            capturedStripeConfig = sessionConfig;
            return {
                url: 'https://stripe.com/checkout/session',
                paymentRecordId: 'payment_222',
                sessionId: 'cs_test_season'
            };
        },
        registerRacer: async () => ({}),
        log: { info: () => {} }
    };
    
    const result = await processStartRegistration({ regData, raceData, dependencies });
    
    t.ok(result.redirect.includes('stripe.com'), 'Should return Stripe URL');
    t.ok(capturedStripeConfig, 'Should have called Stripe with config');
    
    // Check that season pass pricing was applied (275 * 100 = 27500 cents base)
    const unitAmount = capturedStripeConfig.line_items[0].price_data.unit_amount;
    t.ok(unitAmount > 27500, 'Should include season pass pricing plus fees');
    t.ok(unitAmount < 35000, 'Should be season pass price');
    
    t.ok(capturedStripeConfig.line_items[0].price_data.product_data.name.includes('Expert Season Pass'), 
         'Should use season pass name, honoring user selection');
    
    // Verify category pricing was applied
    t.equal(regData.categoryPricingApplied, true, 'Should mark category pricing as applied');
    t.equal(regData.pricingAmount, 275, 'Should store season pass amount');
    t.equal(regData.pricingName, 'Expert Season Pass', 'Should store season pass name');
});

test('processStartRegistration - Marin race with race-level payment options (no series groups)', async (t) => {
    const regData = {
        raceid: '2026_marin_off_minus_road',
        paytype: 'expert',  // User selected expert tier
        category: 'pro_men',
        first_name: 'Sarah',
        last_name: 'Expert',
        email: 'sarah@example.com'
    };
    
    // This race has its own payment structure, NOT using series groups
    const raceData = {
        displayName: '2026 Marin Off-Road',
        regCategories: [
            { id: 'pro_men', catdispname: 'Pro Men', paytype: 'expert' },
            { id: 'sport_women', catdispname: 'Sport Women', paytype: 'sport' },
            { id: 'beginner_men', catdispname: 'Beginner Men', paytype: 'beginner' }
        ],
        paymentOptions: [
            {
                name: 'Expert Entry',
                type: 'expert',
                amount: 130
            },
            {
                name: 'Sport Entry',
                type: 'sport',
                amount: 115
            },
            {
                name: 'Beginner Entry',
                type: 'beginner',
                amount: 100
            }
        ],
        seriesData: {
            seriesId: 'bear_offroad_2026',
            categoryGroups: [
                {
                    name: 'expert',
                    categories: ['pro_men', 'pro_women', 'expert_men_18_minus_44'],
                    paymentOptions: [
                        {
                            type: 'season',
                            name: 'Expert Season Pass',
                            amount: 275
                        }
                    ]
                }
            ]
        },
        stripeMeta: { accountId: 'acct_test' },
        isTestData: false
    };
    
    let capturedStripeConfig = null;
    
    const dependencies = {
        mongo: {
            payments: {
                insertOne: async () => ({ insertedId: 'payment_marin' }),
                updateOne: async () => ({})
            },
            races: {
                updateOne: async () => ({})
            }
        },
        createStripeSession: async ({ sessionConfig }) => {
            capturedStripeConfig = sessionConfig;
            return {
                url: 'https://stripe.com/checkout/session',
                paymentRecordId: 'payment_marin',
                sessionId: 'cs_test_marin'
            };
        },
        registerRacer: async () => ({}),
        log: { info: () => {} }
    };
    
    const result = await processStartRegistration({ regData, raceData, dependencies });
    
    t.ok(result.redirect.includes('stripe.com'), 'Should return Stripe URL');
    t.ok(capturedStripeConfig, 'Should have called Stripe with config');
    
    // Check that Marin expert pricing was applied (130 * 100 = 13000 cents base)
    const unitAmount = capturedStripeConfig.line_items[0].price_data.unit_amount;
    t.ok(unitAmount > 13000, 'Should include Marin expert pricing plus fees');
    t.ok(unitAmount < 18000, 'Should be Marin single race price, not series season pass');
    
    t.ok(capturedStripeConfig.line_items[0].price_data.product_data.name.includes('Expert Entry'), 
         'Should use Marin expert entry name');
    
    // For single race payments (not using series groups), categoryPricingApplied should be false
    t.notOk(regData.categoryPricingApplied, 'Should not mark category pricing as applied for race-specific payment');
});

test('processStartRegistration - Mills Peak race with empty payment options uses series defaults', async (t) => {
    const regData = {
        raceid: '2026_mills_peak_off_minus_road',
        paytype: 'adult',  // User selected adult tier (from series defaults)
        category: 'expert_men_18_minus_44',
        first_name: 'Sarah',
        last_name: 'Mills',
        email: 'sarah@example.com'
    };
    
    // This race has empty paymentOptions array - should use series defaults
    const raceData = {
        displayName: '2026 Mills Peak Off-Road',
        regCategories: [
            { id: 'expert_men_18_minus_44', catdispname: 'Expert Men 18-44', paytype: 'adult', _isSeriesCategory: true }
        ],
        paymentOptions: [
            // After processing, these come from series defaultPaymentOptions
            {
                name: 'Adult entry',
                type: 'adult',
                amount: 100
            },
            {
                name: 'Junior entry',
                type: 'junior',
                amount: 80
            }
        ],
        seriesData: {
            seriesId: 'bear_offroad_2026',
            categoryGroups: [
                {
                    name: 'expert',
                    categories: ['pro_men', 'pro_women', 'expert_men_18_minus_44'],
                    paymentOptions: [
                        {
                            type: 'season',
                            name: 'Expert Season Pass',
                            amount: 275
                        }
                    ]
                }
            ]
        },
        stripeMeta: { accountId: 'acct_test' },
        isTestData: false
    };
    
    let capturedStripeConfig = null;
    
    const dependencies = {
        mongo: {
            payments: {
                insertOne: async () => ({ insertedId: 'payment_mills' }),
                updateOne: async () => ({})
            },
            races: {
                updateOne: async () => ({})
            }
        },
        createStripeSession: async ({ sessionConfig }) => {
            capturedStripeConfig = sessionConfig;
            return {
                url: 'https://stripe.com/checkout/session',
                paymentRecordId: 'payment_mills',
                sessionId: 'cs_test_mills'
            };
        },
        registerRacer: async () => ({}),
        log: { info: () => {} }
    };
    
    const result = await processStartRegistration({ regData, raceData, dependencies });
    
    t.ok(result.redirect.includes('stripe.com'), 'Should return Stripe URL');
    t.ok(capturedStripeConfig, 'Should have called Stripe with config');
    
    // Check that series default adult pricing was applied (100 * 100 = 10000 cents base)
    const unitAmount = capturedStripeConfig.line_items[0].price_data.unit_amount;
    t.ok(unitAmount > 10000, 'Should include series default adult pricing plus fees');
    t.ok(unitAmount < 15000, 'Should be series default single race price');
    
    t.ok(capturedStripeConfig.line_items[0].price_data.product_data.name.includes('Adult entry'), 
         'Should use series default adult entry name');
    
    // For single race payments using series defaults, categoryPricingApplied should be false
    t.notOk(regData.categoryPricingApplied, 'Should not mark category pricing as applied for series default payment');
});

test('processStartRegistration - throws error when payment type not found', async (t) => {
    const regData = {
        raceid: 'test-race-1',
        paytype: 'nonexistent',
        category: 'adult_men',
        first_name: 'Error',
        last_name: 'Test',
        email: 'error@example.com'
    };
    
    const raceData = {
        displayName: 'Test Race',
        regCategories: [
            { id: 'adult_men', catdispname: 'Adult Men', laps: 1 }
        ],
        paymentOptions: [
            {
                name: 'Regular Entry',
                type: 'regular',
                amount: 40
            }
        ],
        stripeMeta: { accountId: 'acct_test' }
    };
    
    const dependencies = {
        mongo: {
            payments: {
                insertOne: async () => ({ insertedId: 'payment_error' }),
                updateOne: async () => ({})
            },
            races: {
                updateOne: async () => ({})
            }
        },
        createStripeSession: async () => ({}),
        registerRacer: async () => ({}),
        log: { info: () => {} }
    };
    
    await t.rejects(
        processStartRegistration({ regData, raceData, dependencies }),
        { message: 'Payment type not found' },
        'Should throw error for missing payment type'
    );
});

test('processStartRegistration - throws error when Stripe account not configured', async (t) => {
    const regData = {
        raceid: 'test-race-1',
        paytype: 'regular',
        category: 'adult_men',
        first_name: 'No',
        last_name: 'Stripe',
        email: 'nostripe@example.com'
    };
    
    const raceData = {
        displayName: 'Test Race',
        regCategories: [
            { id: 'adult_men', catdispname: 'Adult Men', laps: 1 }
        ],
        paymentOptions: [
            {
                name: 'Regular Entry',
                type: 'regular',
                amount: 40
            }
        ]
        // Missing stripeMeta!
    };
    
    const dependencies = {
        mongo: {
            payments: {
                insertOne: async () => ({ insertedId: 'payment_nostripe' }),
                updateOne: async () => ({})
            },
            races: {
                updateOne: async () => ({})
            }
        },
        createStripeSession: async () => ({}),
        registerRacer: async () => ({}),
        log: { info: () => {} }
    };
    
    await t.rejects(
        processStartRegistration({ regData, raceData, dependencies }),
        { message: 'Stripe connect account not defined' },
        'Should throw error when Stripe account missing'
    );
});

