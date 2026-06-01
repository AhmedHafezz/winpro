namespace WinCraft.Domain.Enums;

public enum QuotationStatus { Draft, Sent, Opened, Accepted, Rejected, Expired }
public enum WorkOrderStatus { Pending, InProgress, Completed, OnHold, Cancelled }
public enum DealStage       { Initial, Quotation, Negotiation, Won, Lost }
public enum CustomerType    { Company, Individual }
public enum CustomerStatus  { Active, Prospect, Inactive }
public enum MovementType    { In, Out, Adjust, Return }
public enum ProjectStatus   { Active, InProgress, Completed, OnHold, Cancelled }
public enum SurveyStatus    { Pending, InProgress, Submitted, Converted }
public enum PaymentStatus   { Pending, Received, Overdue }
public enum NotifType
{
    LowStock, QuoteOpened, WoProgress, PaymentDue, SurveySubmitted,
    WorkOrderCreated, DeliveryConfirmed
}
public enum Priority        { Low, Normal, High, Urgent }
public enum DocumentType    { Quotation, Drawing, Cutting, Material, Certificate }
public enum ActivityType    { Call, Meeting, Email, Task, Note }
public enum DispatchStatus  { Scheduled, InTransit, Delivered, Confirmed }
public enum InstallStatus   { Scheduled, InProgress, Completed, SignedOff }
