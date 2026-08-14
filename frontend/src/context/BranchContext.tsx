import { createContext, useContext, useMemo, type PropsWithChildren } from "react";
import { type Branch, type BranchId, getBranchData } from "../data";

type BranchContextValue = {
  selectedBranch: BranchId;
  basePath: string;
  branchData: Branch;
};

const BranchContext = createContext<BranchContextValue | undefined>(undefined);

type BranchProviderProps = PropsWithChildren<{
  branch: BranchId;
}>;

export function BranchProvider({ branch, children }: BranchProviderProps) {
  const value = useMemo<BranchContextValue>(
    () => ({
      selectedBranch: branch,
      basePath: `/${branch}`,
      branchData: getBranchData(branch),
    }),
    [branch]
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error("useBranch must be used within BranchProvider");
  }

  return context;
}

export function useActiveBranchData() {
  return useBranch().branchData;
}
