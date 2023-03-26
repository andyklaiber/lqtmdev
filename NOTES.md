# Links for reference:
- [MongoDB Schema Best Practices](https://www.mongodb.com/developer/products/mongodb/mongodb-schema-design-best-practices/)

# Roles 
## ADMIN
This is Andy & Jeff. Carte blanche to see everything and edit/change everything.

## APIINTEGRATOR
- This role is for the live upload... I do not know if this should be per organization, or generally for any race. 
- Allows posting of data to single endpoint of results.

## DIRECTOR
- This is an owner of the organization. They can create/edit events, register users, manage volunteers
- Identified by username / password

## VOLUNTEER
- This is a helper tied to the organization. They can assign bib numbers, take monies, edit registered racer information
- Identified by username / password

## REGUSER (TBD)
- If you want to allow users to login to this system to manage their registrations, we should design it that way early
- RegUsers are NOT tied to any orgazniation, as they can register across organizations
- Identified by email / password.
- Note - they will live forever in the system, perhaps they should live in a different collection than the other roles.

# Collections & Relationships (DRAFT)

## organizations
{
    _id:
    name:
    address:
    stripeMeta:
    users: [
        {
            name:
            username:
            email: // Needed for forgotten password
            role: ADMIN/DIRECTOR/VOLUNTEER/(APIINTEGRATOR?) // Perhaps we will need an admin user per organization? No need to spoof then... 
            password:
        }
    ]
    races: [ objId1, objId2, objId3 ]
}
//Due to the above ... we would need 1 system level endpoint which allows us to add ADMINS to an organization using postman, then we can add more
  users via the FrontEnd

// Need director dash to
    - Create races
        - Update/set payment types
    - Add/Manage app users as volunteers
    - 

## payments
{
    first_name: 'Andy',
    last_name: 'cashTester',
    email: 'andy.klaiber@gmail.com',
    sponsor: 'data',
    category: 'b35+_men',
    paytype: 'cash',
    racerAge: 38,
    raceid: 'rcx_2022_test_1',
    status: 'unpaid',
    paymentId: '63337dd58f99a6907d061a8f',
    bibNumber: '545',
    paymentReceived: true,
    paymentAmount: '25',
}

## racers 
{
    id
}

## races 
{
    series: 'series_name'
    raceid: ''
}

## series
{

}

## race_results
{

}

## series_results
{

}

## team_comp
{

}

## liveresults
{

}