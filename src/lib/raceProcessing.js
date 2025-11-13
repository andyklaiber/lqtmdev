'use strict';

/**
 * Process race data after aggregation to merge series data for hybrid category model
 * Includes both legacy seasonPassPricing and new categoryGroups
 * 
 * AUTOMATIC MERGING: This function automatically merges series categories with race-specific
 * categories at runtime, ensuring all series categories are always available in the race.
 */
function processRaceWithSeriesData(raceData, log) {
    // If no series data was joined, return unchanged
    if (!raceData.seriesData || raceData.seriesData.length === 0) {
        return raceData;
    }
    
    const seriesConfig = raceData.seriesData[0];
    
    // Build enriched series data object
    raceData.seriesData = {
        seriesId: seriesConfig.seriesId,
        name: seriesConfig.name,
        displayName: seriesConfig.displayName,
        year: seriesConfig.year,
        // Include category groups for hybrid model
        categoryGroups: seriesConfig.categoryGroups || [],
        // Include series categories list for identification
        regCategories: seriesConfig.regCategories || [],
        // Include default payment options (series-wide defaults)
        defaultPaymentOptions: seriesConfig.defaultPaymentOptions || []
    };
    
    // If race has empty payment options, use series default payment options
    if (!raceData.paymentOptions || raceData.paymentOptions.length === 0) {
        if (seriesConfig.defaultPaymentOptions && seriesConfig.defaultPaymentOptions.length > 0) {
            raceData.paymentOptions = seriesConfig.defaultPaymentOptions;
            if (log) {
                log.info({
                    raceid: raceData.raceid,
                    series: raceData.series,
                    paymentOptionsCount: raceData.paymentOptions.length
                }, 'Using series default payment options for race with empty payment options');
            }
        }
    }
    
    // HYBRID MODEL: Merge series categories with race-specific categories
    // This ensures all series categories are always available in the race
    if (seriesConfig.regCategories && seriesConfig.regCategories.length > 0) {
        const raceCategories = raceData.regCategories || [];
        
        // Create a map of race category IDs to their full objects (for race-specific overrides)
        const raceCategoryMap = new Map();
        const raceSpecificCategories = [];
        
        raceCategories.forEach(cat => {
            raceCategoryMap.set(cat.id, cat);
        });
        
        // Separate series categories from race-specific ones
        const seriesCategoryIds = new Set(seriesConfig.regCategories.map(cat => cat.id));
        
        raceCategories.forEach(cat => {
            if (!seriesCategoryIds.has(cat.id)) {
                // Mark as race-specific (not from series at all)
                raceSpecificCategories.push({
                    ...cat,
                    _isRaceSpecific: true
                });
            }
        });
        
        // Merge: Start with series categories (use race override if exists, otherwise series definition)
        const mergedCategories = seriesConfig.regCategories.map(seriesCat => {
            if (raceCategoryMap.has(seriesCat.id)) {
                // Race has an override for this series category - use the race version
                // Mark it as a race override for frontend logic
                return {
                    ...raceCategoryMap.get(seriesCat.id),
                    _isRaceOverride: true,
                    _seriesCategoryId: seriesCat.id
                };
            } else {
                // Use series category as-is (including paytype if present)
                // Mark as pure series category (not overridden)
                return {
                    ...seriesCat,
                    _isSeriesCategory: true
                };
            }
        });
        
        // Add race-specific categories at the end
        mergedCategories.push(...raceSpecificCategories);
        
        // Sort by disporder if available
        mergedCategories.sort((a, b) => {
            const orderA = a.disporder || 999;
            const orderB = b.disporder || 999;
            return orderA - orderB;
        });
        
        // Update race categories with merged result
        raceData.regCategories = mergedCategories;
        
        if (log) {
            const seriesCatCount = seriesConfig.regCategories.length;
            const raceOverrideCount = seriesConfig.regCategories.filter(sc => 
                raceCategoryMap.has(sc.id)
            ).length;
            const raceSpecificCount = raceSpecificCategories.length;
            
            log.info({
                raceid: raceData.raceid,
                series: raceData.series,
                totalCategories: mergedCategories.length,
                seriesCategories: seriesCatCount,
                raceOverrides: raceOverrideCount,
                raceSpecificCategories: raceSpecificCount
            }, 'Merged series and race categories');
        }
    }
    
    
    // NEW: Log if using new category groups model
    if (seriesConfig.categoryGroups && seriesConfig.categoryGroups.length > 0 && log) {
        log.info({
            raceid: raceData.raceid,
            series: raceData.series,
            categoryGroups: seriesConfig.categoryGroups.length
        }, 'Enriched race with hybrid category model');
    }
    
    return raceData;
}

module.exports = {
    processRaceWithSeriesData
};

