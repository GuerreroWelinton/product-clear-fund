# Diccionario de datos CSV

## people.csv

| Campo | Tipo | Obligatorio |
|---|---|---|
| external_person_id | string | Sí |
| document_number | string | Sí |
| first_names | string | Sí |
| last_names | string | Sí |
| phone | string | Sí |
| email | string | No |
| address | string | No |

## memberships.csv

| Campo | Tipo | Obligatorio |
|---|---|---|
| cash_fund_code | string | Sí |
| external_person_id | string | Sí |
| member_number | integer | Sí |
| status | ACTIVE/WITHDRAWN | Sí |
| joined_at | date | No |
| savings_balance | decimal | Sí |

## active-loans.csv

| Campo | Tipo | Obligatorio |
|---|---|---|
| cash_fund_code | string | Sí |
| member_number | integer | Sí |
| original_principal | decimal | Sí |
| paid_principal | decimal | Sí |
| outstanding_principal | decimal | Sí |
| fixed_monthly_interest | decimal | Sí |
| next_installment_number | integer | Sí |
| next_due_period | YYYY-MM | Sí |
