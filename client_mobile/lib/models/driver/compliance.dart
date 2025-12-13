class DriverCompliance {
  final double? hoursDrivenTotal;
  final double? restRequiredHours;
  final String? nextAvailableTime;
  final String? lastRestStart;
  final String? lastRestEnd;
  final bool? isCompliant;
  final String? complianceStatus;

  const DriverCompliance({
    this.hoursDrivenTotal,
    this.restRequiredHours,
    this.nextAvailableTime,
    this.lastRestStart,
    this.lastRestEnd,
    this.isCompliant,
    this.complianceStatus,
  });

  factory DriverCompliance.fromJson(Map<String, dynamic> json) {
    return DriverCompliance(
      hoursDrivenTotal: json['hoursDrivenTotal']?.toDouble(),
      restRequiredHours: json['restRequiredHours']?.toDouble(),
      nextAvailableTime: json['nextAvailableTime'],
      lastRestStart: json['lastRestStart'],
      lastRestEnd: json['lastRestEnd'],
      isCompliant: json['isCompliant'],
      complianceStatus: json['complianceStatus'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'hoursDrivenTotal': hoursDrivenTotal,
      'restRequiredHours': restRequiredHours,
      'nextAvailableTime': nextAvailableTime,
      'lastRestStart': lastRestStart,
      'lastRestEnd': lastRestEnd,
      'isCompliant': isCompliant,
      'complianceStatus': complianceStatus,
    };
  }
}
