namespace WinCraft.Shared.Constants;

public static class Permissions
{
    public const string CrmView      = "crm.view";
    public const string CrmEdit      = "crm.edit";
    public const string QuoteView    = "quote.view";
    public const string QuoteEdit    = "quote.edit";
    public const string QuoteSend    = "quote.send";
    public const string QuoteApprove = "quote.approve";
    public const string DesignView   = "design.view";
    public const string DesignEdit   = "design.edit";
    public const string ProdView     = "prod.view";
    public const string ProdEdit     = "prod.edit";
    public const string InvView      = "inv.view";
    public const string InvEdit      = "inv.edit";
    public const string ReportsView  = "reports.view";
    public const string AdminAll     = "admin.*";
}

public static class DefaultRoles
{
    public static readonly Dictionary<string, string[]> All = new()
    {
        ["SuperAdmin"] = [Permissions.AdminAll],
        ["Manager"]    = ["crm.*", "quote.*", "design.*", "prod.*", "inv.*", "reports.view"],
        ["SalesRep"]   = ["crm.*", "quote.*", "design.view", "design.edit"],
        ["Engineer"]   = ["design.*", "prod.*", "inv.view"],
        ["Warehouse"]  = ["inv.*", "prod.view"],
        ["Installer"]  = ["prod.view"],
        ["Viewer"]     = ["crm.view", "quote.view", "design.view", "prod.view", "inv.view"],
    };
}
