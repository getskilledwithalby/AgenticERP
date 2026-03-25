import { getFirstCompany, getActiveFiscalYear } from "@/lib/db/queries/companies";

export async function getCompanyContext() {
  const company = await getFirstCompany();
  if (!company) {
    return null;
  }

  const fiscalYear = await getActiveFiscalYear(company.id);

  return {
    company,
    fiscalYear,
  };
}
