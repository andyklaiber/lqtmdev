/**
 * Series API Usage Examples
 * 
 * This file demonstrates how to use the Series API endpoints.
 * These are example functions that can be adapted for your frontend or scripts.
 */

const BASE_URL = 'http://localhost:3000/api/series';

/**
 * Example 1: Create a new series with season pass pricing
 */
async function createSeries() {
  const seriesData = {
    seriesId: 'bear_gravity_2026',
    name: 'Bear Gravity Series',
    displayName: 'Bear Gravity Series 2026',
    year: 2026,
    active: true,
    description: 'Bear Gravity Series downhill racing',
    seasonPassPricing: {
      categoryGroups: [
        {
          name: 'High School/Middle School Season Pass - $300',
          categories: [
            'high_school_jvvarsity_boys',
            'high_school_freshsoph_boys',
            'high_school_jvvarsity_girls',
            'high_school_freshsoph_girls'
          ],
          amount: 300
        },
        {
          name: 'Adult Season Pass - $360',
          categories: [
            'pro_men',
            'pro_women',
            'expert_men_18_minus_44',
            'expert_men_age_45_plus_',
            'expert_women',
            'sport_men_18_minus_44',
            'sport_men_45_plus__',
            'sport_women',
            'beginner_men',
            'beginner_women'
          ],
          amount: 360
        }
      ],
      defaultAmount: 360,
      defaultName: 'Season Pass'
    }
  };

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include session cookie
      body: JSON.stringify(seriesData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();
    console.log('Series created:', result);
    return result;
  } catch (error) {
    console.error('Error creating series:', error);
    throw error;
  }
}

/**
 * Example 2: Get series by ID
 */
async function getSeries(seriesId) {
  try {
    const response = await fetch(`${BASE_URL}/${seriesId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();
    console.log('Series retrieved:', result);
    return result;
  } catch (error) {
    console.error('Error getting series:', error);
    throw error;
  }
}

/**
 * Example 3: Update series properties (partial update)
 */
async function updateSeriesDescription(seriesId, newDescription) {
  try {
    const response = await fetch(`${BASE_URL}/${seriesId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        description: newDescription
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();
    console.log('Series updated:', result);
    return result;
  } catch (error) {
    console.error('Error updating series:', error);
    throw error;
  }
}

/**
 * Example 4: Update multiple series properties at once
 */
async function updateSeriesProperties(seriesId, updates) {
  try {
    const response = await fetch(`${BASE_URL}/${seriesId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();
    console.log('Series updated:', result);
    return result;
  } catch (error) {
    console.error('Error updating series:', error);
    throw error;
  }
}

/**
 * Example 5: Update season pass pricing
 */
async function updateSeasonPassPricing(seriesId, pricingConfig) {
  try {
    const response = await fetch(`${BASE_URL}/${seriesId}/season-pass-pricing`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(pricingConfig)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();
    console.log('Season pass pricing updated:', result);
    return result;
  } catch (error) {
    console.error('Error updating season pass pricing:', error);
    throw error;
  }
}

/**
 * Example 6: Remove season pass pricing
 */
async function removeSeasonPassPricing(seriesId) {
  try {
    const response = await fetch(`${BASE_URL}/${seriesId}/season-pass-pricing`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();
    console.log('Season pass pricing removed:', result);
    return result;
  } catch (error) {
    console.error('Error removing season pass pricing:', error);
    throw error;
  }
}

/**
 * Example 7: Deactivate a series
 */
async function deactivateSeries(seriesId) {
  try {
    const response = await fetch(`${BASE_URL}/${seriesId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        active: false
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();
    console.log('Series deactivated:', result);
    return result;
  } catch (error) {
    console.error('Error deactivating series:', error);
    throw error;
  }
}

/**
 * Example 8: Add a new category group to existing pricing
 * (This demonstrates fetching current pricing, modifying it, and updating)
 */
async function addCategoryGroup(seriesId, newGroup) {
  try {
    // First, get the current series
    const series = await getSeries(seriesId);
    
    if (!series.seasonPassPricing) {
      throw new Error('Series does not have season pass pricing configured');
    }

    // Add the new group
    const updatedPricing = {
      ...series.seasonPassPricing,
      categoryGroups: [
        ...series.seasonPassPricing.categoryGroups,
        newGroup
      ]
    };

    // Update the pricing
    return await updateSeasonPassPricing(seriesId, updatedPricing);
  } catch (error) {
    console.error('Error adding category group:', error);
    throw error;
  }
}

/**
 * Example 9: Complete workflow - Create and configure a series
 */
async function completeSeriesSetup() {
  try {
    // Step 1: Create the series
    console.log('Step 1: Creating series...');
    const series = await createSeries();
    
    // Step 2: Update description
    console.log('Step 2: Updating description...');
    await updateSeriesDescription(
      series.seriesId,
      'Updated: Bear Gravity Series downhill racing - Season 2026'
    );
    
    // Step 3: Verify the updates
    console.log('Step 3: Verifying updates...');
    const updatedSeries = await getSeries(series.seriesId);
    console.log('Final series configuration:', updatedSeries);
    
    return updatedSeries;
  } catch (error) {
    console.error('Error in complete setup:', error);
    throw error;
  }
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createSeries,
    getSeries,
    updateSeriesDescription,
    updateSeriesProperties,
    updateSeasonPassPricing,
    removeSeasonPassPricing,
    deactivateSeries,
    addCategoryGroup,
    completeSeriesSetup
  };
}

// Example usage (uncomment to run):
// completeSeriesSetup().catch(console.error);

