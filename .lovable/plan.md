
# Move Salutation to Contact Details Step

## Problem
The "Salutation" field (Mr/Mrs/Ms/Dr) is currently placed at the top of the Company Details step, before "Company Name". This doesn't make logical sense -- salutation is a personal title for the contact person, not a company attribute.

## Solution
Move the Salutation field from `CompanyDetailsStep` to `ContactDetailsStep`, placing it before the contact person's name field where it naturally belongs.

### Changes

**1. `src/components/referral/CompanyDetailsStep.tsx`**
- Remove the Salutation select field
- Remove `salutation` from the component's `formData` interface
- The first field will now be "Company Name"

**2. `src/components/referral/ContactDetailsStep.tsx`**
- Add the Salutation select field at the top, before the contact name
- Add `salutation` to this component's `formData` interface
- Import Select components if not already imported

**3. Parent form component (if needed)**
- Verify `salutation` is already passed in the contact step's formData -- since it's part of the shared form state, this should just work with the field move
