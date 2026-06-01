namespace WinCraft.Shared.Constants;

public static class Permissions
{
    public const string CrmView        = "crm.view";
    public const string CrmEdit        = "crm.edit";
    public const string QuoteView      = "quote.view";
    public const string QuoteEdit      = "quote.edit";
    public const string QuoteSend      = "quote.send";
    public const string QuoteApprove   = "quote.approve";
    public const string DesignView     = "design.view";
    public const string DesignEdit     = "design.edit";
    public const string ProdView       = "prod.view";
    public const string ProdEdit       = "prod.edit";
    public const string InvView        = "inv.view";
    public const string InvEdit        = "inv.edit";
    public const string ProjectView    = "project.view";
    public const string ProjectEdit    = "project.edit";
    public const string ProductionView = "production.view";
    public const string ProductionEdit = "production.edit";
    public const string WarehouseView  = "warehouse.view";
    public const string WarehouseEdit  = "warehouse.edit";
    public const string SurveyView     = "survey.view";
    public const string SurveyEdit     = "survey.edit";
    public const string InstallView    = "install.view";
    public const string InstallEdit    = "install.edit";
    public const string ReportsView    = "reports.view";
    public const string AdminAll       = "admin.*";
}

public static class DefaultRoles
{
    public static readonly Dictionary<string, string[]> All = new()
    {
        ["SuperAdmin"] = [Permissions.AdminAll],
        ["Manager"]    = ["crm.*", "quote.*", "design.*", "prod.*", "inv.*",
                          "project.*", "production.*", "warehouse.*", "survey.*", "install.*", "reports.view"],
        ["SalesRep"]   = ["crm.*", "quote.*", "design.view", "design.edit", "survey.*"],
        ["Engineer"]   = ["design.*", "prod.*", "production.*", "inv.view", "warehouse.view",
                          "project.view", "survey.view"],
        ["Warehouse"]  = ["inv.*", "warehouse.*", "prod.view", "production.view"],
        ["Installer"]  = ["prod.view", "production.view", "install.*", "project.view"],
        ["Viewer"]     = ["crm.view", "quote.view", "design.view", "prod.view",
                          "inv.view", "project.view", "production.view", "warehouse.view",
                          "survey.view", "install.view"],
    };
}
