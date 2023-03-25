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

# Collections & Relationships
## Organizations
- Have Events (if we are going generic rather than races)
- Have Users (admin-types, regusers dont belong here)
- Have Stripe/Payment info setup? 

## Events
Tied to OrgId (one to many)
    - Results could be embedded, as they are 1:1
All events could be a series event (single event would just have 1)... for commonality

## AdminUsers (ADMIN/DIRECTOR/VOLUNTEER/APIINTEGRATOR)
Tied to OrgId ()

## RegUsers
Tied to EventIds (one to many)

## Payments
Tied to RegUserID

