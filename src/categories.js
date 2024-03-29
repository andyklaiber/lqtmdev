// These categories are specific to the results generation for 2022

module.exports = {categoryOrder:[
    "pro_expert",
    "expert_men_39",
    "expert_men_4049",
    "expert_men_5059",
    "expert_men_60",
    "expert_women",
    "single_speed_expert",
    "varsity_boys",
    "varsity_girls",
    "single_speed_sport",
    "emtb_men",
    "emtb_women",
    "sport_men_1939",
    "sport_men_4049",
    "sport_men_5059",
    "sport_men_60",
    "jv_boys",
    "clydesdale_210lb",
    "tandem",
    "sport_women_39",   
    "sport_women_40",
    "jv_girls",
    "poker_league",
    "beginner_men_1939",
    "beginner_men_4049",
    "beginner_men_5059",
    "beginner_men_60",
    "beginner_women_39",
    "beginner_women_40",
    "freshsoph_boys",
    "freshsoph_girls",
    "grom_boys_78_grade",
    "grom_girls_78_grade",
    "grom_boys_56_grade",
    "grom_girls_56_grade",
    "grom_coed_4_grade",
    
],


generateCategoryData: (resultData)=>{
    let allCategories = [];
    Object.keys(resultData.categories).forEach(catId => {
        let catObject = resultData.categories[catId];
        let catData = {
            name: catObject.catdispname,
            identifier: catObject.id,
            displayOrder: catObject.disporder,
        }
        allCategories.push(catData);
    });
    return allCategories;
}
};
