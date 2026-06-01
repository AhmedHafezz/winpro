namespace WinCraft.Shared.Helpers;

public static class Kwd
{
    public const int    Decimals = 3;
    public const string Symbol   = "KWD";
    public const string SymbolAr = "د.ك";

    public static decimal Round(decimal v) =>
        Math.Round(v, Decimals, MidpointRounding.AwayFromZero);

    public static string Format(decimal v)   => $"{v:N3} {Symbol}";
    public static string FormatAr(decimal v) => $"{v:N3} {SymbolAr}";

    public static decimal Tax(decimal v, decimal rate = 0.15m)
        => Round(v * rate);

    public static decimal ApplyDiscount(decimal v, decimal discPct)
        => Round(v * (1 - discPct / 100));

    public static decimal GrandTotal(decimal subtotal, decimal discPct, decimal taxRate = 0.15m)
    {
        var afterDisc = ApplyDiscount(subtotal, discPct);
        return Round(afterDisc + Tax(afterDisc, taxRate));
    }

    public static decimal PricePerSqm(decimal totalPrice, int widthMm, int heightMm)
        => widthMm > 0 && heightMm > 0
           ? Round(totalPrice / ((decimal)(widthMm * heightMm) / 1_000_000m))
           : 0;
}
