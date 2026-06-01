namespace WinCraft.Application.Common;

public record PagedResult<T>(List<T> Items, int Total, int Page, int PageSize)
{
    public int TotalPages => (int)Math.Ceiling((double)Total / PageSize);
}
