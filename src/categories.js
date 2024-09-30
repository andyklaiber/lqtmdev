// These categories are specific to the results generation for 2022

module.exports = {categoryOrder:[
    "pro_expert",
    "expert_men_under_40",
    "expert_men_4049",
    "expert_men_5059",
    "expert_men_60",
    "expert_women_all_ages",
    "single_speed_expert",
    "e_minus_mtb_menwomen",
    "emtb_menwomen",
    "single_speed_sport",
    "sport_men_under_40",
    "sport_men_4049",
    "sport_men_5059",
    "sport_men_60",
    "clydesdale_210lb",
    "tandem",
    "underbike",
    "poker_class",
    "sport_women_39",
    "sport_women_40",
    "high_school_boys",
    "high_school_girls",
    "beginner_men_under_40",
    "beginner_men_4049",
    "beginner_men_5059",
    "beginner_men_60",
    "beginner_women_all_ages",
    "grom_boys_78_grade",
    "grom_girls_78_grade",
    "grom_boys_56_grade",
    "grom_girls_56_grade",
    "grom_coed_4_grade"
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
